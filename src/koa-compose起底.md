---
date: 2020-08-08
tags: nodejs
---

> 去掉exports，注释，运行时参数校验之后，整个koa-compose的代码只有18行，所以今天就是要对折18行代码起底。

### koa-compose本质上就是将一组方法迭代

在下面的代码中，middleware就是一组方法，使用dispatch(0)让这些方法从头开始迭代，在dispatch中，给每个用户函数传入上下文以及next，而next的功能就是让迭代进行下去。

> koa-compose是对用户的一组方法的迭代，并且把迭代时机交给用户掌握。

```js
// v1, 10lines
function compose (middleware) {
  return function (context) {
    return dispatch(0)
    function dispatch (i) {
      let fn = middleware[i]
      if (!fn) return
      return fn(context, dispatch.bind(null, i + 1));
    }
  }
}
```

现在代码来到了10行，它是一个完整的功能，甚至已经可以使用async函数作为中间件来执行了。不过作为一个工业级的软件，koa-compose需要做一些规范和完善工作。

### 全Promise化

为了更健壮的支持异步场景，compose在middleware的写法做了规范（https://github.com/koajs/koa#middleware）
- async function
- common function

```js
// async functions (node v7.6+)
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// Common function
// Middleware normally takes two parameters (ctx, next), ctx is the context for one request,
// next is a function that is invoked to execute the downstream middleware. It returns a Promise with a then function for running code after completion.

app.use((ctx, next) => {
  const start = Date.now();
  return next().then(() => {
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
});
```

即使不做改造，最开始的10行代码也可以支持koa的推荐写法了，为了使规范更加健壮，compose在源码级别进一步保证了：
- next执行后都会返回Promise的实例
- compose(middleware)(ctx)是Promise的实例

为了支持上面的特性，compose在源码加了两个改动

1. 如果到了迭代的末尾返回Promise.resolve()
2. 对于不规范的middleware写法兜底
    
兜底方式为`Promise.resolve(fn(context, dispatch.bind(null, i + 1)))`。

1. 如果fn返回一个thenable则使用thenable的终值作为resolve返回promise的终值
2. 如果fn返回一个普通值，这个值就作为promise的返回值

> 当然，其实koa-compose并不关注中间件的返回值，一般来说会关注对ctx的副作用，以及next的执行策略。

```js
// v2.1 10lines
function compose (middleware) {
  return function (context) {
    return dispatch(0)
    function dispatch (i) {
      let fn = middleware[i]
      if (!fn) return Promise.resolve()
      return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
    }
  }
}
```

### 全Promise化2.0

上面的代码还不能严谨的保证promise化，无外乎还是围绕两种midware的写法

- async function，不会有问题，async function一定会返回一个promise（当然，同时也是thenable）
- common function：
    - 返回一个thenable或者其他值，不会有问题。
    - **返回前抛错**，整个compose执行过程被终止，这个case需要再处理一下。

在fn执行的时候，如果有异常抛出，返回一个rejected的promise，终值为这个抛出的错误。

```js
// v2.2 14lines
function compose (middleware) {
  return function (context) {
    return dispatch(0)
    function dispatch (i) {
      let fn = middleware[i]
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

### compose后的结果作为普通中间件再次参与compose

compose的结果有两种使用方式：

- 作为入口在koa内部被调用
- 作为普通中间件再次参与compose

也可以顺便看一下它是如何在koa内部被调用的，下面代码算是koa故事的开始了。listen更像是一个语法糖，实际上核心是handleRequest，http原生server的事件最终它handle。

再看这段代码`fnMiddleware(ctx).then(handleResponse).catch(onerror);`，可以看出koa内部对于**合成后中间件的用法，只传了一个ctx**（嗯，所以这一大段代码就为了演示这一件事）。

```js
listen(...args) {
    debug('listen');
    const server = http.createServer(this.callback());
    return server.listen(...args);
}
callback() {
    const fn = compose(this.middleware);

    if (!this.listenerCount('error')) this.on('error', this.onerror);

    const handleRequest = (req, res) => {
        const ctx = this.createContext(req, res);
        return this.handleRequest(ctx, fn);
    };

    return handleRequest;
}
handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    onFinished(res, onerror);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
}
```

那么对于这两种用法，就可以通过被传入的参数来区分了：

1. 第一个参数都是ctx
2. 第二个参数：
    1. 不存在，作为入口被koa内部调用
    2. 存在，则为next迭代过程，作为普通中间件被调用

无论使用方式如何，第一件事总是把自身的中间件迭代完成，不同点在于，如果作为普通中间件，compose本身迭代完成时，它还需要负责调用next，从而让迭代进行下去。如下，如果迭代到头`i === middleware.length`，尝试选用第二个参数`next`作为迭代函数，有则执行，无则终止。

```js
function compose (middleware) {
  return function (context, next) {
    return dispatch(0)
    function dispatch (i) {
      let fn = middleware[i]
      if (i === middleware.length) fn = next      
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

### 保障next只执行一次

如果next可以被调用多次，意味着整个迭代是树形，对于**http服务器这种存在副作用的场景**会导致运行结果不正确。

如下代码，如果正常迭代，i始终大于index，每次迭代index立即赋值为i，同一个迭代函数再次调用时满足`i === index`则整个迭代被rejected。

```js
function compose (middleware) {
  return function (context, next) {
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

```
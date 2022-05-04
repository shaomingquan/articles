

TL;DR

throw

## 实现

koa有两个重要的实例：
- app实例
- ctx实例

在这两个实例中都存在错误处理相关逻辑：

### Application类（app实例）的错误处理

如下代码是app实例的callback和默认onerror方法，在这段代码里我们能看到：

- 如果用户没加app的error监听，koa会用内置的默认handler监听error
- 在默认handler里面会打印这个错误，并根据一些规则忽略打印
- compose之后返回的fn是一个能返回promise的function（可以将其看成async function），如果内部存在error，会来到ctx的onerror
- onFinish如果报错了，会来到ctx的onerror

问题：

- koa会在什么时机emit，error？
- 默认的onerror里面有个throw，不会

```js
  /**
   * Return a request handler callback
   * for node's native http server.
   *
   * @return {Function}
   * @api public
   */

  callback() {
    const fn = compose(this.middleware);

    if (!this.listenerCount('error')) this.on('error', this.onerror);

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }

  /**
   * Default error handler.
   *
   * @param {Error} err
   * @api private
   */

  onerror(err) {
    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError =
      Object.prototype.toString.call(err) === '[object Error]' ||
      err instanceof Error;
    if (!isNativeError) throw new TypeError(util.format('non-error thrown: %j', err));

    if (404 === err.status || err.expose) return;
    if (this.silent) return;

    const msg = err.stack || err.toString();
    console.error(`\n${msg.replace(/^/gm, '  ')}\n`);
  }

  /**
   * Handle request in callback.
   *
   * @api private
   */

  handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    onFinished(res, onerror);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }
```

### ctx的错误处理

- 非标准错误标准化
- app实例emit error事件
- 如果headerSent，返回
- 重置header，并且根据错误类型返回500或404

> 虽然koa中未指定替换handler的实践，但我们仍然可以重写这个方法

```js
  onerror(err) {
    // don't do anything if there is no error.
    // this allows you to pass `this.onerror`
    // to node-style callbacks.
    if (null == err) return;

    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError =
      Object.prototype.toString.call(err) === '[object Error]' ||
      err instanceof Error;
    if (!isNativeError) err = new Error(util.format('non-error thrown: %j', err));

    let headerSent = false;
    if (this.headerSent || !this.writable) {
      headerSent = err.headerSent = true;
    }

    // delegate
    this.app.emit('error', err, this);

    // nothing we can do here other
    // than delegate to the app-level
    // handler and log.
    if (headerSent) {
      return;
    }

    const { res } = this;

    // first unset all headers
    /* istanbul ignore else */
    if (typeof res.getHeaderNames === 'function') {
      res.getHeaderNames().forEach(name => res.removeHeader(name));
    } else {
      res._headers = {}; // Node < 7.7
    }

    // then set those specified
    this.set(err.headers);

    // force text/plain
    this.type = 'text';

    let statusCode = err.status || err.statusCode;

    // ENOENT support
    if ('ENOENT' === err.code) statusCode = 404;

    // default to 500
    if ('number' !== typeof statusCode || !statuses[statusCode]) statusCode = 500;

    // respond
    const code = statuses[statusCode];
    const msg = err.expose ? err.message : code;
    this.status = err.status = statusCode;
    this.length = Buffer.byteLength(msg);
    res.end(msg);
  },
```

### headerSent

这玩意是啥，就是代理一下原生res的headersSent

```js
  /**
   * Check if a header has been written to the socket.
   *
   * @return {Boolean}
   * @api public
   */

  get headerSent() {
    return this.res.headersSent;
  },
```

headerSent是一个挺重要的变量，在ctx的默认错误handler，如果headerSent是true，则不启用默认返回，同时对于一些其他的header操作也有拦截

正常来讲，用户的midware和controller不会直接操作原生的res，但也有例外，有时候我们想跳过koa的处理，按自己的方式write res，如下：

```js
const Application = require('koa')

const app = new Application

app.use(ctx => {
    ctx.respond = false // 跳过koa的handleResponse
    const res = ctx.res
    const see = () => {
        console.log(res.headersSent)
    }
    see() // false
    setTimeout(() => {
        res.write('1\n')
        see() // true
    }, 1000)
    setTimeout(() => {
        res.end('2\n')
        see() // true
    }, 2000)
})

app.listen(4329)
```

http stream在第一次write内容的时候就把status以及header都写入了，这时在前端已经可以拿到ttfb时间了（首字节已拿到）这时再去修改status header已经没有用了，koa在这种情况下会认为：

- 用户已经处理http了，我就不管了，即使是在errorHandler里

相关node源码如下：write会来到_send方法，并且随着第一次写入数据，header也一并被写入

```js
// This abstract either writing directly to the socket or buffering it.
OutgoingMessage.prototype._send = function _send(data, encoding, callback) {
  // This is a shameful hack to get the headers and first body chunk onto
  // the same packet. Future versions of Node are going to take care of
  // this at a lower level and in a more general way.
  if (!this._headerSent) {
    if (typeof data === 'string' &&
        (encoding === 'utf8' || encoding === 'latin1' || !encoding)) {
      data = this._header + data;
    } else {
      const header = this._header;
      this.outputData.unshift({
        data: header,
        encoding: 'latin1',
        callback: null
      });
      this.outputSize += header.length;
      this._onPendingData(header.length);
    }
    this._headerSent = true;
  }
  return this._writeRaw(data, encoding, callback);
};
```

### onFinish

onFinish这个lib的功能很简单，`Execute a callback when a HTTP request closes, finishes, or errors.`。在上面的koa源码中，koa使用onFinish捕获http的socket异常。

onFinish一定会被调用：

- 如果正常finish没error，ctx.onerror会早早return，不会有实际的错误处理逻辑。
- 如果finish之后，headerSent已为true（或者已不可写入），不会往socket内部写东西。

onFinish还在另一个地方起作用了，如果body是个stream，koa会在onFinish回调内部释放stream

```js
    // stream
    if (val instanceof Stream) {
      onFinish(this.res, destroy.bind(null, val));
      if (original != val) {
        val.once('error', err => this.ctx.onerror(err));
        // overwriting
        if (null != original) this.remove('Content-Length');
      }

      if (setType) this.type = 'bin';
      return;
    }
```
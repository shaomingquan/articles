---
date: 2021-04-25
tags: nodejs
---


在使用nodejs做http服务的时候，koa经常是一个快捷好用的选择，不过毕竟node*http不止有koa一种选择，开源社区不会保证每个lib都能完美支持koa，在使用类似lib时，需要开发者能从koa app中跳出来，重新持有原生的node http req和res。这里提供两种思路：

- 从顶层开始就不走koa
- 在中间件之后不走koa

### 从顶层开始就不走koa

如下，koa本质上就是一个可以handle原生req的callback，可以轻易的做到在某些条件下不走koa，以及两种http lib混用也不是不行（如何让koa&express共存？）

```js
const app = new Koa();
const koaCb = app.callback()
const server = http.createServer((req, res) => {
    if (true) {
        return res.end('hello')
    }
    koaCb(req, res)
});
server.listen(PORT, () => {});
```

### 在中间件之后不走koa

koa有两大核心步骤

- 迭代中间件，确定body值
- 分析body类型，确定返回方式

其中的第二步是可以跳过的，方法是修改上下文的`respond`变量`koaCtx.respond = false`，源码在`koa/lib/application.js`，这里的respond就是负责将koa body对应到具体的http respons。

```js
function respond(ctx) {
  // allow bypassing koa
  if (false === ctx.respond) return;
  // ...
  // ...
```

很容易，比如下面用了原生req&res做一个download功能。

```js
export const route = new Router

route.get('/download', async (koaCtx) => {
    // bypassing koa
    koaCtx.respond = false

    // handle node native http
    const req = koaCtx.req
    const res = koaCtx.res
    handleDownload(req, res)
})
```

这种方式极度灵活，要求开发者必须了解每个中间件的副作用，koa中间件的副作用不止会影响koa的ctx，也可能会影响原生的req&res对象。典型的`koa-body`就会对req stream做一个消费行为，再中间件的下游，使用req stream就会有问题。必要的时候，可以选择在特定的条件下跳过中间件：

```js
const bodyHandler = koaBody({
    multipart: true,
    formLimit: '100mb',
    jsonLimit: '100mb',
})
app.use(async (ctx: Context, next: any) => {
    // 在上传的时候不走koaBody
    const useBodyHandler = ctx.url.indexOf('/bff/api/rest/upload') === -1
    if (useBodyHandler) {
        await bodyHandler(ctx, next)
        return
    }
    await next()
});
```

当然，上面的代码看起来很dirty，不过通过加一些简单的配置化工作应该可以解决。
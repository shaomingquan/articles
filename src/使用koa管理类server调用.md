---
date: 2022-01-24
tags: nodejs
---

tldr:

- 如果架构内部可抽象出client server模式，都可以用过`koa-compose`和`koa-router`管理。
- `koa-compose`和`koa-router`都可以脱离http这一套逻辑独立运行，这点有别于koa（koa就是http框架）。

koa这一套前端太熟悉了，它能轻易的实现

- 中间件模型
- api的分组和嵌套，按组指定中间件

在面向http的koa应用中，原生node提供最原始的req和res，由koa把它们包装成ctx并提供一些语法糖，中间件机制则是有koa-compose提供，经历过中间件的处理后回到koa源码，用原生node处理res。

在koa体系的两个关键组件中，koa-compose完全可以脱离koa，而koa-router则是依赖几个固定的ctx成员，包括：method，path，request。这些本应来自http的成员并不影响我们的使用，我们可以包装自己的ctx，轻易兼容koa-router，demo如下：

```js
const compose = require('koa-compose')
const Router = require('koa-router')

const router = new Router()

router.get('/xiaoA', async (ctx, next) => {
    ctx.body += 'xiaoA'
});

router.get('/xiaoB', async (ctx, next) => {
    ctx.body += 'xiaoB'
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const asyncCall = compose([
    async (ctx, next) => {
        ctx.body = 'hello '
        await delay(1000)
        await next()
    },
    router.routes(),
])
  
// 包装ctx
const ctxA = { path: '/xiaoA', method: 'GET', request: {} /* just mock兜底 */, body: '' }
asyncCall(ctxA).then(() => {
    console.log(ctxA.body) // hello xiaoA
}).catch(e => {
    console.log(e)
});

// 包装ctx
const ctxB = { path: '/xiaoB', method: 'GET', request: {} /* just mock兜底 */, body: '' }
asyncCall(ctxB).then(() => {
    console.log(ctxB.body) // hello xiaoB
}).catch(e => {
    console.log(e)
});
```

如上我们脱离了koa和http这一套使用了koa-compose和koa-router，可以在哪些场景应用呢？

- 架构上明显分层，如需要ipc（electron，chrome extension，jsBridge）
- 大型应用的内部分层
- server client同构

> 通过包装ctx轻易的兼容了koa-router，使其能脱离http场景，

> 把一个熟悉的模式应用到不同的场景，感觉还是不错的。这种模式脱离场景的思考方式也值得在其他地方应用。
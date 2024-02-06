---
date: 2021-07-14
tags: javascript
---

最近有一个bff的仓库，有很多http的rpc，对于单个bff请求，在调试过程中经常会需要查看有哪些rpc，为了方便查看这些rpc，bff在单个http生命周期添加rpc追踪功能（非prod环境），返回给前端，这样控制台即可查看bff的rpc调用。

想搞这个需求的时候，我第一时间就想到了`async_hooks`，利用一下`async_hooks`的能力：

- 追踪nodejs async上下文之间的关系
- 追踪nodejs async上下文的生命周期

找找资料改动改动，写个工具：

```js
const asyncHooks = require('async_hooks');
const store = new Map();

const asyncHook = asyncHooks.createHook({
    init: (asyncId, _, triggerAsyncId) => {
        // 如果当前上下文存在数据，后代上下文继承上一代数据
        if (store.has(triggerAsyncId)) {
            store.set(asyncId, store.get(triggerAsyncId))
        }
    },
    destroy: (asyncId) => {
        if (store.has(asyncId)) {
            // 不需要了，解除引用
            store.delete(asyncId);
        }
    }
});

asyncHook.enable();

const createRequestContext = (data) => {
    const requestInfo = data;
    // 初代数据
    store.set(asyncHooks.executionAsyncId(), requestInfo);
    return requestInfo;
};

const getRequestContext = () => {
    return store.get(asyncHooks.executionAsyncId());
};

module.exports = { createRequestContext, getRequestContext };
```

用起来：

***1. 顶层中间件添加context数据***

```js
// trace 中间件（非prod环境）
if (process.env.NODE_ENV !== 'production') {
    const hk = require('./utils/hooks')
    app.use(async (ctx, next) => {
        // 创建context数据，所有的后代async上下文都会继承于此
        hk.createRequestContext({ ctx }) 
        await next()
        ctx.body = ctx.body || {}

        // 抛给控制台看
        ctx.body.__trace = ctx.__trace
    })
}
```

***2. rpc调用get context数据，并添加调用数据***


```js
let addRequest = () => {}
let addResponse = () => {}

if (process.env.NODE_ENV !== 'production') {
    const hk = require('./hooks')

    // 在rpc调用的地方，拿到上下文，操作__trace
    const { ctx: maybeCtx } = hk.getRequestContext() || {}
    if (maybeCtx) {
        ctx = maybeCtx
        ctx.__trace = ctx.__trace || []
        const traceItem = {}
        ctx.__trace.push(traceItem)
        addRequest = (request) => {
            traceItem.request = request
            traceItem.requsetTs = Date.now()
        }
        addResponse = (response) => {
            traceItem.response = response
            traceItem.responseTs = Date.now()
            traceItem.duration = traceItem.responseTs - traceItem.requsetTs
        }
    }
}
```

DONE

> 当然，其他操作也可以串起来，比如数据库查询，缓存查询之类
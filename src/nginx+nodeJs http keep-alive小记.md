---
date: 2022-02-11
tags: nodejs
---

> keep-alive指定了无状态http对于底层的复用规则，http 1.0默认不复用（close），http 1.1默认服用（keep-alive），http 2.0则自带多路复用，实现了真正的单socket并发（区别pipeline模式）

### 我们的应用是否已经存在keep-alive？

在客户端，如果我们的客户端是：

1. 浏览器：除非是古代浏览器，都是自带keep-alive的
2. 其他client：比如nodejs就可以设置agent，来改变socket的复用行为，axios在node端也是用的同一套

> 在浏览器inspector的network tab中，无法看到keep-alive header，用Charles抓包可以看到，抓包往往是比较客观的

在服务端：

1. nodejs 0.8之后默认支持keep-alive
2. nginx默认支持

nginx又比较特殊，作为proxy，它既是服务端也是客户端，nginx作为客户端的keep-alive则需要设置（网上一堆如何设置的，这里不说了）

那么最终作为业务服务器的nodejs，如何check keep-alive已经开启成功了呢？看下面的代码：

```js
const getTcp = (req) => {
    // 内核返回的tcp对象，存在源码的symbol中
    const socket = req.socket
    return socket[Object.getOwnPropertySymbols(socket)[1]]
}

let prev = null
app.use(async (ctx, next) => {
    const tcp = getTcp(ctx.req)
    if (prev !== null) {
        if (tcp === prev) {
            console.log('reuse, yes')
        } else {
            console.log('reuse, no')
        }
    }
    prev = tcp
    await next()
})
```

如果不开nginx的keep alive，都是`reuse, no`，开了发现依然存在部分`reuse, no`，只知道chrome并发socket会对这个有影响（当下http1.1都是多socket并发，pipeline模式早已去除）

> **上面的测试代码并不严谨，但作为定性分析够用**

### nodejs server中关于keep-alive的配置

- 作为client agent相关设置，https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_new_agent_options
- 作为server，https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_server_keepalivetimeout

> nodejs server的keep-alive符合debounce模式，当socket空闲时间超过keepalivetimeout时close，如果又有新的request来了，`则request处理期间不计时，完毕计时`

### nodejs keep-alive与graceful-shutdown

在pm2的graceful指南中，建议用户在接收信号后，在server.close的回调中结束进程，来看看server.close的描述（同net.close）

- https://nodejs.org/dist/latest-v12.x/docs/api/net.html#net_server_close_callback

> Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a 'close' event. The optional callback will be called once the 'close' event occurs. Unlike that event, it will be called with an Error as its only argument if the server was not open when it was closed.

注意callback回调的时刻，在所有的connection（socket）ended的时候才会调用，在keep-alive的场景中，每个connection在idle之后会再等一个keepalivetimeout，再到ended状态。而在shutdown场景下，这个keepalivetimeout是不需要等待的，很简单，因为既然已经不接收connection了（上游流量掐了，server也close了），也就没必要等keep-alive了。

在github上就有现成的可以支持 https://github.com/thedillonb/http-shutdown/blob/master/index.js，比较简单，大概做了几件事：

- 维护connections map，socket建立（或者说socket被分发到worker）时添加，关闭时移除
- 维护socket的_idle状态，默认为true，server收到请求后设置为false，请求finish后设为true
- 销毁socket：
    - 收到`SIGINT`后server.close调用，并销毁_idle为true的socket，isShuttingDown标记为true
    - 这时候还有_idle为false的请求，这些请求finish后，如果isShuttingDown为true，自动销毁
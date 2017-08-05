***一个延迟响应引发的思考***

首先这边是一个简单的node httpServer。

```js
let http = require('http');
let reqs = [];
http.createServer((req, res) => {
  if(req.url === '/') {
    reqs.push(req);
    console.log(reqs.length, 1, Date.now())
    setTimeout(function () {
      res.end('hello')
    }, 5000)
  }
}).listen(3000);
```

因为setTimeout和res.end都是异步的，所以当我同时发送两条请求的时候，这两条响应的请求应该是并发的，但是，在使用chrome快速访问两次localhost:3000时，结果如下。

```
1 1501954312378
2 1501954317387
```

what? 阻塞了?。我正yy着这世上玄幻的事情就是多啊，是不是有什么代码的禁忌，或者node内部有怎样的设计。后来其实想多了。我用curl和Safari重新测试了一次，结果。

```
1 1501954657488
2 1501954657986
```

差不多响应时间就是我在Safari切tab的瞬间，证明上面的代码时非阻塞的。

所以我发现这实际上是**chrome的一个策略**。当同时访问同一路径的资源时，**chrome会等到其中其次访问的首字节到来时再去发送其他请求**，而且如果是三个tab同时访问，后两个tab不会因为第一个tab首字节到来而并发，后两个tab遵循前两个tab的规则。

当请求两个不同路径时不会有这个问题。至于chrome为啥这么做，最开始我以为是可用性验证，但当我返回403 404 500表示服务不可用时，另一个请求仍然发出去了。

不深究了，这件事进一步说明用户代理的复杂度。

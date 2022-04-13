---
date: 2022-02-12
tags: nodejs
---


看看这两个fetch除了url不同还有啥区别？

```js
fetch('/',options).then(x => x.text())
fetch('/' + Math.random(),options).then(x => x.text())
```

chrome的多请求并发机制做web的都很熟了，不过在chrome环境下对于一组并发请求，上面的只会与服务端建立1个socket，下面的会建立5个socket（服务端支持keep-alive）

策略可能是这样的，对于同一个url，chrome会优先复用旧socket，验证一下：

```js
const options = {
    headers: {
        Connection: 'close'
    }
}
async function reqs () {
    for (var i = 0 ; i < 10 ; i ++) {
        
        const res = await Promise.all([
            fetch('/xx',options).then(x => x.text()),
            fetch('/xx',options).then(x => x.text()),
            fetch('/yy',options).then(x => x.text()),
            fetch('/yy',options).then(x => x.text()),
            fetch('/yy',options).then(x => x.text()),
        ])
        res.forEach(console.log)
    }    
}

reqs()

// 用node跑了个localhost，并按socket去重统计，总共是两个socket
// 可以验证猜想
```

换到Safari则是没有上面的事，都是5个socket。
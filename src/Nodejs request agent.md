---
date: 2020-09-06
tags: nodejs
---

agent 用户代理，用户通过代理去访问服务器，浏览器就是一种用户代理，在nodejs中向其他服务发送请求的过程中，也引入了一个代理的概念，不过相比浏览器要轻量级太多。

nodejs中的agent用做控制请求的并发数。来看看它的参数：

```md
- maxSockets <number> Maximum number of sockets to allow per host. Each request will use a new socket until the maximum is reached. Default: Infinity.
- maxTotalSockets <number> Maximum number of sockets allowed for all hosts in total. Each request will use a new socket until the maximum is reached. Default: Infinity.
- maxFreeSockets <number> Maximum number of sockets to leave open in a free state. Only relevant if keepAlive is set to true. Default: 256.
```

通过参数大概可以知道，通过agent可以统筹所有从当前nodejs实例向外所有请求的并发情况：

- keepAlive：是否复用socket，默认是false，需要手动开启
- maxSockets：单个host的并发，比如Chrome中的域名并发限制6。只不过nodejs默认Infinity
- maxTotalSockets：总socket数
- maxFreeSockets：http请求end之后不会立马destroy socket，会把当前socket释放给agent，内部有个存储以便与复用socket，也就是所谓的keepAlive

当一组request使用同一个agent的时候，它们也就在同一个管辖的区域，被统一统筹。单个agent实例使用下面存储统筹这些请求和socket：

```js
// 结构都是一个object，key是根据request信息生成的string，值是一个数组（队列）
this.requests = {};    // 所有pending的请求 {[name: string]: clientRequest[]}
this.sockets = {};     // 所有socket       {[name: string]: socket[]}
this.freeSockets = {}; // 空闲的socket     {[name: string]: socket[]}
```

### clientRequest发送流程

***1 获取socket***

当用户通过nodejs的clientRequest向外部发起http请求时，clientRequest会先建立一个与目标服务器的socket，先看看是否存在可用agent：

- 如果没有agent，走自己的socket建立逻辑。
- 如果有，尝试从agent中获取一个socket，会调用agent的addRequest方法。

addRequest是agent的核心代码之一，这里有几个核心变量（源码请看，https://github.com/nodejs/node/blob/v10.x/lib/_http_agent.js#L138）

- name：`var name = this.getName(options);`，通过getName获取，获取一个命名空间，后续拿到正确的存储。
- freeLen：`var freeLen = this.freeSockets[name] ? this.freeSockets[name].length : 0;`，当前命名空间下，空闲socket的数量。
- sockLen：`var sockLen = freeLen + this.sockets[name].length;`，当前命名空间下，socket总量。

根据freeLen和sockLen，以及请求options，获取socket的逻辑如下：

```js
if (freeLen) {
    // 如果有可用的闲置socket，使用一个闲置socket作为请求的socket
} else if (sockLen < this.maxSockets) {
    // 如果没有闲置的socket
    // 且socket总量未达上线
    // 最终会通过agent的createConnection方法创建一个socket
} else {
    // 没有可用socket，让请求处于pending状态
}
```

> 这里又有两个比较关键的方法`getName`,`createConnection`，放在后面详细说。

***2 请求发起***

拿到socket之后，会来到clientRequest的`tickOnSocket`方法，（源码请看，https://github.com/nodejs/node/blob/v10.x/lib/_http_client.js#L634。）。新建一个内部的parser，并且将socket与这个parser关联：

```js
function tickOnSocket(req, socket) {
  var parser = parsers.alloc();
  // ...
  // parser加一个钩子，如果已经parse出response对象，就调用这个钩子
  parser.onIncoming = parserOnIncomingClient;
  // ...
  // 源源不断的parse
  socket.on('data', socketOnData);
  // ...
}
function socketOnData(d) {
  var socket = this;
  var req = this._httpMessage;
  var parser = this.parser;
  // parse这个buffer
  var ret = parser.execute(d);
  // .....
}
```

`parserOnIncomingClient`里面的细节比较多，这里摘出主流程：

```js
function parserOnIncomingClient(res, shouldKeepAlive) {

  // ...
  // 监听end事件
  res.on('end', responseOnEnd);

  // 交给用户设置的callback，让用户消费这个stream
  var handled = req.emit('response', res);
  // ...
  return 0;  // No special treatment.
}

// 在clientRequest的构造函数中，早已监听response事件
if (cb) {
  this.once('response', cb);
}
```

***2 结束请求***

在`responseOnEnd`中如果是keepAlive模式，最终会调用`emitFreeNT`，以释放空闲socket：

```js
function emitFreeNT(socket) {
  socket.emit('free');
}
```

socket的这个事件在socket被agent创建的时候就早已监听，实际上就是emit agent的free事件：

```js
function installListeners(agent, s, options) {
  function onFree() {
    debug('CLIENT socket onFree');
    agent.emit('free', s, options);
  }
  s.on('free', onFree);
  // ...
```

agent的free事件在constructor就早已监听：

```js
  this.on('free', (socket, options) => {
    var name = this.getName(options);

    if (socket.writable &&
        this.requests[name] && this.requests[name].length) {
      // 如果存在pending的request，直接分配给这个request
    } else {
      
      var req = socket._httpMessage;
      if (req &&
          req.shouldKeepAlive &&
          socket.writable &&
          this.keepAlive) {
        // keepAlive模式，尝试放回socket池

        if (count > this.maxSockets || freeLen >= this.maxFreeSockets) {
          // 超过了总上限或者超过了空闲池的上限
        } else if (this.keepSocketAlive(socket)) {
          // 让socket keepAlive并且加到空闲池
        } else {
          // 不想让socket keepAlive，这里目前执行不到
          // Implementation doesn't want to keep socket alive
          socket.destroy();
        }
      } else {
        // 非keepAlive或者socket已为不可写，销毁socket
        socket.destroy();
      }
    }
  });
```

主流程就是这么多，不过细节就太多了，比如要注意内存管理，socket回收，这里不再讨论了。

### hack it

通过改写agent实例一些方法可以做一些hack的事：

#### 自定义分组

分组逻辑是getName定的，重写getName可以做到：

- 把不同域名的服务合并管理
- 把不同path的服务分块管理（这种很常见，不同path可能是不同集群）

#### proxy

改写proxy可以在生成socket阶段做一些事情，很自然的就具备代理的能力。github上有个哥们弄了一个https://github.com/TooTallNate/node-agent-base。通过用户传的一个callback介入socket生成逻辑，然后重写了addRequest，以及重新监听了free方法，从而放弃了原agent的keepAlive逻辑。哥们基于这个lib写了一些有用的工具，可以参考下。

 * [`http-proxy-agent`][http-proxy-agent]: An HTTP(s) proxy `http.Agent` implementation for HTTP endpoints
 * [`https-proxy-agent`][https-proxy-agent]: An HTTP(s) proxy `http.Agent` implementation for HTTPS endpoints
 * [`pac-proxy-agent`][pac-proxy-agent]: A PAC file proxy `http.Agent` implementation for HTTP and HTTPS
 * [`socks-proxy-agent`][socks-proxy-agent]: A SOCKS (v4a) proxy `http.Agent` implementation for HTTP and HTTPS

也可以从更底层去拦截建立socket的过程，修改`createConnection`，如下将所有请求代理到`localhost:3000`：

```js
const http = require('http')
const net = require('net')
const createConnection = net.createConnection

function optModifer (opt) {
    const nextOpt = Object.assign({}, opt)
    nextOpt.host = 'localhost'
    nextOpt.port = '3000'
    return nextOpt
}

// 修改option以达到代理的目的
http.globalAgent.createConnection = function (opt, oncreate) {
    const nextOpt = optModifer(opt)
    return createConnection.call(this, nextOpt, oncreate)
}

const req = http.request({
    host: 'xxx.com',
    port: '80',
    path: '/',
    method: 'get',
}, (res) => {
    let ret = ''
    res.setEncoding('utf-8')
    res.on('data', str => {
        ret += str
    })
    res.on('end', () => {
        console.log(ret)
    })
})
req.end()
```
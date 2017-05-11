最近在看《Nodejs硬实战》这本书，在书中的前半部分基础库介绍中不止一次提到了`unref`方法，这里总结下。

> 从表面上来看，基于消息队列的node会等进程中没有handle的时候终止进行，unref则是打破这种“常规”。

`unref`从字面上理解为“不引用”，实则是***不加入引用计数***，说到引用计数，大概最先想到的就是js的垃圾回收机制。如果将`foo`变量`unref`，那么进程将忘记`foo`的handle。

***Timer***

timer1，和timer2是两个事件监听，unref的意思是进程不关心timer2有事件监听这件事，所以等到timer1的事件触发完毕之后，直接退出。
```javascript
var timer1 = setTimeout (function () {
    console.log('timer1 trigger');
}, 3500);

var timer2 = setInterval (function () {
    console.log('timer2 trigger');
}, 1000);

timer2.unref(); // 加这个试试

// stdout
// timer2 trigger
// timer2 trigger
// timer2 trigger
// timer1 trigger
```

***类似的***

获得服务器内容之后告诉进程我不在需要server的事件了。
```javascript
var http = require('http');
var server = http.createServer(function (req, res) {
    res.end('hello world');
}).listen(3000);

http.get({
    port: 3000
}, function (res) {
    res.pipe(process.stdout);
    server.unref(); // http 的listening process 不鸟了
});
```
分离子进程，这样主进程只负责开进程，之后就退出。
```
var _process = require('child_process').spawn('node', ['./httpserver.js'], {
    detached: true, // 设为分离的
    stdio: ['ignore', 'pipe', 'pipe'] // 忽略输入流
});
_process.unref(); // 进程不要在意process的事件流
```

***`unref`从何而来？***
追根溯源应该是到`libuv`的`uv_unref`方法。底层库提供了添加handle监听和移除handle监听的功能。参考自[第50行](https://github.com/nodejs/node/blob/master/src/handle_wrap.cc)。使用`uv_unref`方法，官网说明如下。
> Un-reference the given handle. References are idempotent, that is, if a handle is not referenced calling this function again will have no effect.

idempotent（等幂性）意味着`unref`没有副作用。

```c++
void HandleWrap::Unref(const FunctionCallbackInfo<Value>& args) {
  HandleWrap* wrap;
  ASSIGN_OR_RETURN_UNWRAP(&wrap, args.Holder());

  if (IsAlive(wrap))
    uv_unref(wrap->GetHandle());
}
```
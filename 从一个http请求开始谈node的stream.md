写一段代码看一下http的req对象到底是什么。

```js
require('http').createServer((req, res) => {
  traverseProto(req)
  traverseProto(res)
  res.end('hello')
}).listen(3002)

function traverseProto (o) {
  let protos = []
  while(o) {
    o = Object.getPrototypeOf(o)
    o && protos.push(o.constructor.name)
  }
  console.log(protos.join(' --> '))
  console.log('---------')
}
```

结果：

```js
IncomingMessage --> Readable --> Stream --> EventEmitter --> Object
---------
ServerResponse --> OutgoingMessage --> Stream --> EventEmitter --> Object
---------
```

没错，req它是流，所以理所当然的也是EventEmitter的实例。也如直觉，他是一个可读流。那res按道理应该是个可写流，这个直觉就不对了，深入分析之前可以这样认为，res不是真正意义上的终点，终点应该是一个net.socket的tcp连接。

既然是req是可写流，我们可以用它的一些方法，试一下这样的写法。

```js
req.push(new Buffer('test')) // 来自readable的方法
req.push(new Buffer('test'))
req.pipe(res)
```

不出意外的是可以用的。

res不是writable，writable的pipe方法实际上是被封禁的，直接继承于Stream的OutgoingMessage实际上可以使用pipe方法，所以下面的代码可以运行：

```js
res.write(new Buffer('test'))
res.write(new Buffer('test'))
res.write(new Buffer('test'))
res.pipe(req)
req.pipe(res)
```

pipe当然是最理想的方法，试想一下对pipe这个词语分析，是理解成“建立管道”，还是“输出数据”呢？那不妨像下面这样试试：

```js
req.pipe(res)
req.push(new Buffer('test')) // 来自readable的方法
req.push(new Buffer('test'))
```

试验后的答案是前者。又试想，我们想把这个流的每一个chunk做处理，很容易想到的是监听data事件以及end事件，这样我们可以收到每一段数据，所以其实pipe内部是异步操作的。此时可以实现双工流，先看看用法吧，典型的是gzip。

```js
const gzip = zlib.createGzip();
const fs = require('fs');
const inp = fs.createReadStream('input.txt');
const out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out); // 可被写，可去写
```

这里有点像java中接口的概念，如果你想调用pipe，你得怎么样，反之你想被pipe调用亦然。那具体怎么做，不妨试试看，如下。

```js
const Stream = require('stream')
const util = require('util');

const myReadStream = function (options) { Stream.Readable.call(this, options) }
const myWriteStream = function (options) { Stream.Writable.call(this, options) }
const myDuplexStream = function (options) { Stream.Duplex.call(this, options) }

myWriteStream.prototype._write = function (chunk, encoding, callback) {
  console.log(chunk.toString())
  callback()
}

myReadStream.prototype._read = function () { // 反正一开始要调用，干啥都行，不干也行
  console.log('read!')
}

myDuplexStream.prototype._read = function () { // 反正一开始要调用，干啥都行，不干也行
  console.log('read!')
}

myDuplexStream.prototype._write = function (chunk, encoding, callback) { // 反正一开始要调用，干啥都行，不干也行
  this.push(new Buffer(chunk.toString() + 'test'))
  callback()
}

util.inherits(myReadStream, Stream.Readable)
util.inherits(myWriteStream, Stream.Writable)
util.inherits(myDuplexStream, Stream.Duplex)

const r = new myReadStream()
const w = new myWriteStream()
const d = new myDuplexStream()

r.pipe(d).pipe(w)

r.push(new Buffer('test'))
r.push(new Buffer('test'))
r.push(new Buffer('test'))
r.push(new Buffer('test'))
r.push(new Buffer('test'))
r.push(new Buffer('test'))

setInterval(function () {
  r.push(new Buffer('test'))
}, 1000)
```

在看看都有什么option吧。highWaterMark这个我之前就用过，通过设置这个可以限制资源的下载速度。可是放在我刚刚实现的pipe链条里却并不符合我的预期，这又是什么情况？
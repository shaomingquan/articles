---
date: 2020-09-02
tags: nodejs
---

介绍一个nodejs的经典问题：

```js
// index.js
var fs = require('fs');
var rs = fs.createReadStream(__dirname + '/test.md', {highWaterMark: 11});
var data = '';
rs.on("data", function (chunk){
    data += chunk; 
});
rs.on("end", function () { 
    console.log(data);
});
```

```js
// test.md
床前明月光,疑是地上霜;举头望明月,低头思故乡。
```

执行`node index.js`打印：**床前明��光,疑是地上霜;���头望明月,低头���故乡**。乱码了，为什么呢？首先`data += chunk`实际上是`data += chunk.toString()`，chunk是`Buffer`，所以说为什么呢？看看`Buffer.prototype.toString`的文档：

> If encoding is 'utf8' and a byte sequence in the input is not valid UTF-8, then each invalid byte is replaced with the replacement character U+FFFD. encoding <string> The character encoding to use. Default: 'utf8'.

也就是说实际上Buffer的toString是存在一个decode过程的，对于单次decode，如果存在无法decode的情况，每个字节就用一个replacement character替代。对于上面的case，因为强制的让buffer按11个字节每次这种方式输出，不可避免的把完整的utf8连续字节截断了，一个完整的编码变成了两个不完整的编码，对于不完整额错误编码，结局就是被replacement character替代。

如何解决呢？

#### 1. 用nodejs自带的decoder

https://nodejs.org/dist/latest-v12.x/docs/api/string_decoder.html

> When a Buffer instance is written to the StringDecoder instance, an internal buffer is used to ensure that the decoded string does not contain any incomplete multibyte characters. These are held in the buffer until the next call to stringDecoder.write() or until stringDecoder.end() is called.

道理很简单，内部有个buffer，当个chunk内无法解析的不硬解析，等下次凑成一个完整的utf8字符，除非调用end。

```js
const fs = require('fs')
const rs = fs.createReadStream(__dirname + '/test.md', { highWaterMark: 11 })
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

let ret = ''
rs.on('data', chunk => {
    ret += decoder.write(chunk)
})

rs.on('end', () => {
    ret += decoder.end()
    console.log(ret)
})
```

#### 2. 先全部收集，再一起toString

道理也很简单，我根本不急着拿到一个string，先把完整的buffer都拿到一起toString。这样的做有场景上的局限，一些流式的字符串解析就不能做了，比如through2中可以做字符流检测和替换（类似中间人攻击）。

```js
var fs = require('fs');
var rs = fs.createReadStream(__dirname + '/test.md', {highWaterMark: 11});
var chunks = [];
var size = 0
rs.on('data', function (chunk) {
    chunks.push(chunk)
    size += chunk.length
});
rs.on('end', function () {
    var buf = Buffer.concat(chunks, size); 
    console.log(buf.toString());
});
```

#### 3. 直接变成字符流

可以用setEncoding把readableStream直接变成字节流：

```js
var fs = require('fs');
var rs = fs.createReadStream(__dirname + '/test.md', {highWaterMark: 11});
rs.setEncoding('utf8');
var data = '';
rs.on("data", function (chunk){
    console.log(chunk)
    data += chunk; 
});
rs.on("end", function () { 
    console.log(data);
});
```

输出是：

```js
床前明
月光,疑是
地上霜;
举头望明
月,低头
思故乡。
床前明月光,疑是地上霜;举头望明月,低头思故乡。
```

可见nodejs在内部把这个字节流变成了合法的字符流，看看setEncoding的文档：

> By default, no encoding is assigned and stream data will be returned as Buffer objects. Setting an encoding causes the stream data to be returned as strings of the specified encoding rather than as Buffer objects. For instance, calling readable.setEncoding('utf8') will cause the output data to be interpreted as UTF-8 data, and passed as strings. Calling readable.setEncoding('hex') will cause the data to be encoded in hexadecimal string format.

可以再看看`on('data', callback)`，回调的文档。正如nodejs文档所说，也可以是字节流。

> chunk <Buffer> | <string> | <any> The chunk of data. For streams that are not operating in object mode, the chunk will be either a string or Buffer. For streams that are in object mode, the chunk can be any JavaScript value other than null.

### 其实费这么大劲，内部存储其实是一样的

decode作用有两个：

1. 校验
2. 生成正确的string内部数据结构，以便于：
    1. 索引字符
    2. 以及语义化的操作这部分内部二进制数据

其实就是对于相同二进制的不同视角，decode生成了一个新的view。
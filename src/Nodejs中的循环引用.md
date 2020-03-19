## 勘误

Nodejs其实不存在循环引用问题，设计者使用cache绕过了这个问题，多次require同一个包，除了第一次执行整个脚本以外，后续直接引用`exports`。
所以为什么有“半引用”？仅仅是因为代码还没有执行到那里，所以exports没挂上而已，在最下面的例子里，我自己举了个例子，现在在这里例子上加一段代码：

```js
//1.js
exports.before = 1;
require('./2.js');
exports.after = 1;
//2.js
require('./3.js');
//3.js
require('./4.js');
//4.js
var js1 = require('./1.js');
console.log(js1.before);
console.log(js1.after);
// <del>当运行1.js的时候，nodejs检测到依赖循环，所以js1.after会被丢弃，此时打印undefined。</del>
// <del>当运行2.js的时候，无依赖循环，正常打印两个1。</del>
// 👆上面对运行结果的解释不准确
setTimeout(() => {
    console.log('in timeout:', js1.before);
    console.log('in timeout:', js1.after);   
    // 都打印1，因为这时候脚本1执行完了，所以自然exports对象就存在after这个属性了
    // 所以仅仅是没运行到而已，值没挂上
})
```

----------------------------------------------------------------

***今天的问题是，当nodejs中的模块存在循环依赖的时候，nodejs会怎样处理呢？***

先看一个官方例子：

```js
//cycle.js
console.log('main starting');
const a = require('./cycle_a');
const b = require('./cycle_b');
console.log('in main, a.done=%j, b.done=%j', a.done, b.done);
```
```js
//cycle_a.js
console.log('a starting');
exports.done = false;
const b = require('./cycle_b');
console.log('in a, b.done = %j', b.done);
exports.done = true;
console.log('a done');
```
```js
//cycle_b.js
console.log('b starting');
exports.done = false;
const a = require('./cycle_a');
console.log('in b, a.done = %j', a.done);
exports.done = true;
console.log('b done');
```
运行cycle.js
```
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done=true, b.done=true
```
按照官方的说法：当cycle引入cycle_a 的时候，cycle_a 开始引入cycle_b，在执行 cycle_b的时候，因为cycle_b 又要引用cycle_a，这时nodejs发现出现循环依赖了，所以此时b引用的a，是一个`unfinished copy`，也就是下面的部分。

```js
//cycle_a.js
console.log('a starting');
exports.done = false;
/*** 当发现下一次引用会造成依赖循环时，node将丢弃下面语句 ***/
const b = require('./cycle_b');
console.log('in a, b.done = %j', b.done);
exports.done = true;
console.log('a done');
```

再举一非官方例子。

```js
//1.js
exports.before = 1;
require('./2.js');
exports.after = 1;
//2.js
require('./3.js');
//3.js
require('./4.js');
//4.js
var js1 = require('./1.js');
console.log(js1.before);
console.log(js1.after);
```
当运行1.js的时候，nodejs检测到依赖循环，所以js1.after会被丢弃，此时打印undefined。
当运行2.js的时候，无依赖循环，正常打印两个1。
记录遗漏的小tips...不定期更新~。并会将一些需要整理拓展的单拿出来。

move curries :）

***不到万不得已不要动流程下面的代码！！！***

***“提前执行”***
如下代码，当我点一下`#logo`，会打印什么？
```js
document.getElementById('logo').onclick = function () {
	console.log('logo clicked');
    document.addEventListener('click', function () {
        console.log('document clicked');
    }, false);
};
```
目的是点`#logo`在全局绑一个点击。但两条都打印，看起来很奇葩，其实很合理。只因为冒泡，事件没冒泡完毕就绑定了document的事件，document不幸被冒泡。如下nextTick一下就ok了。如果不知道事件冒泡的绝对百思不得其解，即使知道事件冒泡也难免踩坑。
```js
document.getElementById('logo').onclick = function () {
	console.log('logo clicked');
	setTimeout(function () {
		document.addEventListener('click', function () {
            console.log('document clicked');
        }, false);
	})
};
```

***timer small diff***
不管你如何理解`requestAnimationFrame`这个方法，你需要知道的是`requestAnimationFrame`在当前tab被切走的时候不能继续运行。`setInterval`会继续运行。

但是，在Iphone上面，根据app的不同，切到后台的时候`requestAnimationFrame`的表现也有所不同。如果app有定制化的容器，那么可能会在后台继续执行`requestAnimationFrame`，但是Safari浏览器的表现符合预期，切tab表现与浏览器一致。

***real fps***
浏览器真的总是保持60fps吗？不是。
以transition为例，当动画过快或者动画过慢的时候fps会降低，降低的原因有所不同，过快而降低是因为即使60fps也会发生视觉中断，过慢而降低是即使降低fps也够顺滑。这是js不好控制的（或许有的库已经有类似优化），而浏览器原生支持的。

***event 变量***
之前看过同事这样一段代码。
```js
dom.onclick = function (e) {
  func(event);
}
```
我说这不对啊应该是`func(e)`。没成想真是对的。
```js
document.onclick = function (e){
  console.log(e === event); // true   event 是个特殊的变量，在event发生的时候会自动赋值。
}
```
***image preview***

一种最简单的图片preview的方法。使用浏览器默认的preview效果，报一个url即可。


***checked 伪类注意事项***

使用checked伪类即可自定义选框样式。但有一点需要注意。
- 不要用`display: none;` 使选框丧失tab键的可访问性

见此例http://dabblet.com/gist/e269f10328615254e29e

***resolve 一个Promise实例***
记在这里，加深印象。如下。
```js
var p1 = new Promise(function (resolve, reject) {
  setTimeout(() => reject(new Error('fail')), 5000)
})

var p2 = new Promise(function (resolve, reject) {
  setTimeout(() => resolve(p1), 4000)
})

p2
  .then(result => console.log(result))
  .catch(error => console.log(error))
// Error: fail
```
当p2 resolve p1，那么p1离开pending状态，且继承了p2的then和catch调用。注意Promise一旦被实例出来，异步调用就已经开始执行，所以是5000ms后打印，而不是9000。

***Promise.all 可传任意Iterator实现***
关于Iterator是使用ES6应该活用的点，解构，展开，传参，遍历...很多操作都是Iterator通用。同期推出的Promise.all也支持Iterator，这让我觉得这个思路很重要。所以像下面的代码也不奇怪了。
```js
function* pros () {
  yield Promise.resolve(1);
  yield Promise.resolve(2);
  yield Promise.resolve(3);
}
Promise.all(pros()).then(_ => console.log(_))
// [1, 2, 3]
```

***culc 与预处理器***
最大的区别在于，预处理器只能算绝对值，无法处理动态的相对情况。下面效果预处理器就做不到。
```css
#wrapper {
  min-height: calc(100vh - 7em);
}
```
***冷门调速方法***
cubic-bezier，是css3动画中最普遍的调速方法。极少有人会知道还有个调速方式是steps。它可以作为序列帧的实现，与cubic-bezier统称为调速方法。还是要多刷官方文档，少刷快餐文。https://developer.mozilla.org/en-US/docs/Web/CSS/single-transition-timing-function。

***tcp***
一定超时才重发吗？
没收到ack一定会重发吗？
上面两者在tcp滑动窗口控制的情况下皆为否定答案。（图解TCP6.4.7）

***console log***

在执行一次`JSON.parse`的时候失败了，遂打印之。贴到命令行中发现可以成功！后来我意识到打印结果不一定是真实结果。

```js
> console.log('\\"hello\\"')    #打印这个值#
\"hello\"
> JSON.parse('\"hello\"')    #按照打印值进行parse，可以成功#
'hello'
> JSON.parse('\\"hello\\"')    #实际上是失败的#
SyntaxError: Unexpected token \ in JSON at position 0
```

***hack options***

这是我之前忽略的一个点。模块抛出配置。
```js
//lib.js
exports.options = {};
exports.run = function (fn) {
	return fn(options);
}
//main.js
require('./lib').options = {...}
require('./lib').run(_ => console.log(_))
```
可作为构架问题传参层数过多时快速配置的hack方法。不建议大量使用。

***cannot require index.js?***

不能require 目录下的index.js？那一定是package.json将main引到另外一个文件或者文件夹了。

***uncaught xxx***

unreject的promise与uncaught的error比起来，柔和得多，代码会继续执行下去，此时的unhandledRejection看起来并不是程序的兜底，更像是对unhandledRejection的采集方案（上报错误异常）。

相反，error的不柔和。uncaughtException会使程序挂掉，而即使process绑定了uncaughtException事件，error发生之后，下面的代码都不会继续执行了，如果在一个http的声明周期里面，会呈现出卡住的现象，此时该实例处理后续请求会堵塞。

***写配置文件的好处***


1，杜绝环境变量在程序中捣乱。环境变量在不利于模块化。

2，罗列关键参数。便于查找关键程序位置。

***hot tip***

hotreload很快的一大原因是用内存中的代码去注入，所以其实每一次的hotreload都不会在磁盘上留下痕迹，这也是需要build流程的原因。

***并发防止变量污染***

这些基础的东西竟然忘了。


***catch 不住的 error***

端口占用是catch不住的！


***shell tip***

等号两边的空白不是可有可无的，下面的两个等号只有这样用才是对的，加空白或者去空白都是错的。
```sh
agent="12121"
if [ $agent = "1212" ]; then
  echo "~~"
fi
```

***A() <--> new A***

在创建对象的过程中，已经可以获得this的正确类型，new 是return的语法糖。这里可以做任意调用都可以返回A实例的语法糖。

```js
function A() {
  if(!this instanceof A) {
    return new A
  }
}
```

***求和计算***

求和计算一定记得踢出异常值，但是分位数计算就不需要这样做。

***func.length***

今天突然想到，mocha是如何判定测试是异步的呢？使用函数的length属性。又想起在做curry化的时候其实用过，判定什么时候返回调用。

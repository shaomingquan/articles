### import cost

这个插件讲了一个比较关键的细节。

```js
let { a } = require('b') // 这样会将b先全部加载进来。
let a = require('b/a') // 这样写会引入一部分内容，因为直接指向一个特定的文件。还要看具体库的实现方式。
```

用import cost可以快速的判断引入方式的优劣。

### 用pm2运行其他runtime的应用

关于pm2执行mdmd -p 3001的事，可以使用[json描述文件](https://newsn.net/say/pm2-start-json.html)执行。也可以使用配置`--interpreter bash`执行。本质上pm2只是监听子进程的信号量，而不在乎信号量来源的运行时。

pm2也提供了watch等开发级别的功能，配合pm2的gracefulReload的功能，也给线上不断线热更新带来了可能性。

### return in node

在node runtime中，return语句不在函数内执行也可以，因为node本质上是把文件中写的东西包装在一个函数中并且注入module和export等东西。所以下面代码在nodejs文件中可以运行，浏览器环境则不可以。

```js
var a = true
if(a) {
  return
}
console.log(3)
```

http://s2.pstatp.com/pgc/v2/resource/pgc_web/static/style/image/home/page7_circle8.cff547b.png

http://s2.pstatp.com/pgc/v2/resource/pgc_web/static/style/image/home/page7_circle8.7cbd639.png

### animation-delay妙用

有时候需要组合动画，希望首屏的时候显示中间状态而不是初始状态，这时候animation-delay可以设置为负值，负值即d为快进的意思。

### background-image中的资源

这些资源的加载发生在选择器被触发之后。有点自带懒加载的意思。

### npm run的自动PATH

引用自阮一峰老师的[文章](http://www.ruanyifeng.com/blog/2016/10/npm_scripts.html)。所以很多时候不用加路径名。

> npm 脚本的原理非常简单。每当执行npm run，就会自动新建一个 Shell，在这个 Shell 里面执行指定的脚本命令。因此，只要是 Shell（一般是 Bash）可以运行的命令，就可以写在 npm 脚本里面。比较特别的是，npm run新建的这个 Shell，会将当前目录的node_modules/.bin子目录加入PATH变量，执行结束后，再将PATH变量恢复原样。

### js能力检测

之前有说过css能力检查。新开一个v8实例，这个实例的抛错不会导致当前进程挂掉。用eval也行。

```js
let asyncawait = true;
try {
  new Function('async function test(){await 1}');
} catch (error) {
  asyncawait = false;
}
```

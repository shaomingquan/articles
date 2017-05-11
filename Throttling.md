回忆一下目前所了解的节流的一些业务场景。

### throttle vs debounce
先看看实现。
throttle: 需要一个锁机制。**注意承接上下文和参数**。
```js
function throttle (func, time) {
    var timer = null;
    return function () {
        if(timer) {
            return;
        }

        var context = this;
        var args = arguments;
        timer = setTimeout(function () {
            clearTimeout(timer);
            timer = null;
            func.apply(context, args);
        }, time)
    }
}

// 实现至少两秒打印一次
var console0 = throttle ( function () {console.log(0)}, 2000 );
setInterval(function () { console0() }, 10);
```
首次反馈的throttle，希望首次得到反馈，而后的事件throttle。很简单，将上面的函数执行部分换一下位置即可。
```js
function throttle (func, time) {
    var timer = null;
    return function () {
        if(timer) {
            return;
        }

        var context = this;
        var args = arguments;
        func.apply(context, args);
        timer = setTimeout(function () {
            clearTimeout(timer);
            timer = null;
        }, time)
    }
}

```
debounce:  每次重置timer。
```js
function debounce (func, time) {
    var timer = null;
    return function () {
       clearTimeout(timer);

        var context = this;
        var args = arguments;
        timer = setTimeout(function () {
            clearTimeout(timer);
            timer = null;
            func.apply(context, args);
        }, time)
    }
}

// 页面滚动完毕后过一秒执行log1。
var console1 = debounce ( function () {console.log(1)}, 1000 );
document.onscroll = console1;
```
debounce的话，没有见到有首次需要执行的场景。

### 业务场景

##### 适量获取动态交互数据

scroll, mousemove, onresize等事件，使用适当的throttle进行节流，可以省运行时间。

一般，涉及到动画的时候，time应为17ms。

##### 阻止不必要行为

用户连续输入，连续滚动，数据连续进行任何变化时。有时候我们只**关心交互结束时的数据**。 

此时利用debounce节流可以实现类 inputend，scrollend之类的（**类end**）事件形式。减少主流程的执行次数。

##### 用户疯狂行为

点点点，点点点。。。。。此时使用throttle，程序即可依然闲庭信步。
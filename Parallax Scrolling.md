## 关于视差滚动

对于视差滚动这个事情，笔者跟它还有一些故事。最开始进入学校社团的时候，学长给我们展示的web特效就是一个横向的视差滚动，不过当时学长说错了，这个并不是js实现的效果。下面开始正题。

什么是视差滚动？百度百科如是说。视差滚动（Parallax Scrolling）是指让多层背景以不同的速度移动，形成立体的运动效果，带来非常出色的视觉体验。作为今年网页设计的热点趋势，越来越多的网站应用了这项技术。

放到web前端来讲，就是当页面发生滚动或者页面大小变化时，背景或者内容不会常规变化，我觉得可以统称为视差滚动。比如这个[这个](http://johnpolacek.github.io/scrollorama/)。至于如何制作视差滚动特效，三分靠编码，七分靠设计。首先很好的题材创意很重要，然后是良好的编码实现了。现在有一些库可以帮助我们实现动画流畅体验良好的视差滚动效果。关于视差滚动的实现原理，我总结以下几点。

## 监听交互产生的实时变化量

页面上的常见交互有哪些会产生实时变化的量？鼠标移动，滚动条移动，窗口大小变化。

最典型的是监听滚动条位置。实际上，我们可以这样想象。滚动条就是进度条，而页面就是影片内容。而视差滚动的程序就是要我们导演好这部戏。就像下面这样，在事件监听函数里面捕捉滚动条的位置，根据这个位置来设置页面中元素的样式。

```js
function onscrollHandler() {
	window.scrollY;
	window.scrollX;
	//...
}
window.onscroll = onscrollHandler;
```
同样的道理，页面上鼠标位置的变化，页面窗口的大小变化，都可以被监听然后实时获取一个鼠标位置的值或者窗口大小变化的值，然后根据这个实时的值进行样式的变化。总结来说他们与滚动条算是一类，一句话总结##视差滚动需要一个能被实时并连续获取的值##。鼠标位置变化的例子如[github的404页面](https://github.com/shaomingquan123)。窗口大小变化的效果暂未找到，监听窗口大小变化可作为响应式布局的降级方案。

## background-position属性

background-position的值为百分比的时候，背景的位置以元素的宽度的百分比偏移。当窗口大小变化引起元素宽度变化时，以同样的百分比进行偏移时，实际偏移量就发生了改变，当这个百分比不同时，偏移量发生改变的速度也不一样。当不同的背景（当然肯定是png带透明的），层叠在一起且background-position的百分比不同的时候，窗口大小发生变化时就产生了富有层次感的视差滚动特效。

上面讲的就是本人第一次见到的web特效，来自silverbackapp.com
不过主页已变更。

## background-attachment属性

将background-attachment设置成fixed，当页面滚动的时候，背景不滚动。页面不同section有不同背景的时候，效果还是蛮好的，是一个制作视差滚动的捷径，但是效果比较单一。

## transform实现

利用透视产生视差效果。也是最近才发现的方法，下面的文章讲得很详细。
https://developers.google.com/web/updates/2016/12/performant-parallaxing

## “帧堆积”
当慢速滚动的时候，是正常的视差效果，当快速滚动的时候，动画不会一下子突兀的执行，而是有种堆积延迟的特点。见MacBook页面，http://www.apple.com/macbook/

## 写在后面

相信还有很多有意思的实现方式，欢迎补充，并对上文进行指正。
> 我觉得不管怎么讲或者说3D技术已经不再新鲜，但这毕竟还是很炫酷的。

这个大概是最好的教程了（flag）。https://developer.mozilla.org/en-US/docs/Learn/WebGL/By_example

##

首先，脚本所运行的环境支持webgl吗？

https://developer.mozilla.org/en-US/docs/Learn/WebGL/By_example/Detect_WebGL

## 

***给你的画布加个背景色。***

https://developer.mozilla.org/en-US/docs/Learn/WebGL/By_example/Clearing_with_colors

## 

***加一个颜色的滤镜。***

https://developer.mozilla.org/en-US/docs/Learn/WebGL/By_example/Color_masking

讲了graphics pipeline的概念。一个像素要经过一系列的通道处理，而不是单纯的输出最后的状态。

##

***裁剪。***

https://developer.mozilla.org/en-US/docs/Learn/WebGL/By_example/Basic_scissoring

- pixels：物理像素。
- fragments：webgl中的逻辑“像素”，属性不止rgba。

一个fragment要经过很多次的图形变换才能以最终的形态展示到屏幕上。如上一个主题：颜色滤镜。而且有可能被丢弃，比如一个距离camera超级远的东西，那么这一系列fragments的最后就是一个pixel。

本例中设置了一个方形裁剪，没有通过裁剪的fragments就被丢弃了。裁**通道**默认是关闭的，这里有个重要的api是`enable`，还可以用`enable`开启一些其他不支持的属性。

##

***画布的大小。***

https://developer.mozilla.org/en-US/docs/Learn/WebGL/By_example/Canvas_size_and_WebGL

这个例子告诉我们css中的宽高和行间属性的宽高的区别。画布看起来有多大是css控制的，画布内部有多少可用“像素”是行间属性控制的

## 

没有了？后面的例子都无法运行。。我可能要放弃这份教材了。。再看看这个  http://www.webglacademy.com/courses.php?courses=0|1|20|2|3|4|23|5|6|7|10#4
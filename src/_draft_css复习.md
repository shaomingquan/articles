> css常用知识点整理

***标准盒模型和怪异盒模型之间的区别？***

答：以offsetHeight为标准，标准盒模型的offsetHeight = height + border-top(bottom) + padding-top(bottom)，怪异盒模型的offsetHeight为height，在ie9-的版本中使用特定的文档头可以触发怪异盒模型，其他皆为标准盒模型。css3中添加box-sizing属性让用户自己选择盒模型，默认值为context-box（标准盒模型），可选择border-box（怪异盒模型）。

引申：

- 怪异盒模型作为来自ie的非标准产物，在生产环境中有何应用场景？答：在移动端页面的全横宽大按钮，它的父元素往往是宽度百分之一百再加个padding，此时使用怪异盒模型可以让父元素加padding的情况下保持原来的100%的宽度，超过100%则出现横向滚动条，会产生很差的体验。

***css选择器的优先级规则是什么？***

答：ice原则，i为id选择器占100分，c为class选择器占10分，e为element选择器占1分，!important优先级高于一切，*（通配选择器）选择器最低。伪类算一分，伪类的效果没有生效可能是有更高优先级的选择器控制了样式：

```css
#test div {
  color: red; // 因为选择器优先级比下面的高，所以下面的样式在hover时不会生效。
}
.test div:hover {
  color: green;
}
```

引申：

- css中用什么方法打破优先级原则？答：!important。

> 可以引申到下一个大问题。

***一个元素的样式可以来自哪些地方？具体的优先级是怎样的？***

答：优先级从低到高为，用户代理的默认样式，用户自定义样式（容易遗漏），继承样式（容易遗漏），link的样式和style里面的样式（常见误区），行间样式。!important一样可以跨越来源的优先级。

引申：

- 我发现用户自定义样式在有些站点是不生效的，比如字体大小，为了照顾特殊人群，我们在编写css的时候应该注意什么？答：标签的应用<em><strong>，有些网站为了防爬虫用了特殊字体，不要使用固定px作为值，em模式不支持用户用户字体放大（smaller，larger一样），rem模式支持（这算是rem与em的一个区别吧），但是rem在pc端兼容度依然不够，rem目前可在移动端放心使用。google pc搜索页使用small去设置字体，并且没有在根元素设置固定的字体大小，设置根元素之后则自定义样式不生效。

***BFC是什么？***

答：fc Formatting context(格式化上下文)，规定子元素如何定位，以及如何其如何影响其他元素的定位。BFC 即 Block Formatting Contexts。

触发bfc的条件：
body 根元素
浮动元素：float 除 none 以外的值
绝对定位元素：position (absolute、fixed)
display 为 inline-block、table-cells、flex
overflow 除了 visible 以外的值 (hidden、auto、scroll)

bfc让处于其内部的子元素不受外部影响，反之亦然，可称之为隔离。具体体现在。
1，套上bfc则可消除margin 重叠，若父元素不是bfc那么子元素穿透父元素相互影响（导致重叠）。
2，清理浮动。我理解未清理的浮动是一种未隔离的布局效果，这是违背bfc原则的。
3，阻止元素被浮动元素覆盖。这个主要是影响块级元素内的行间元素，这些行间元素会于浮动元素产生文字环绕效果，违背了bfc的原则，所以bfc选择与浮动元素保持水平排列，并且宽度自适应。

引申：

- IFC是什么？IFC 只有在一个块级元素中仅包含内联级别元素时才会生成，子元素水平放置，margin只有水平，vertical-align生效规定行框内各个块对齐方式，行框的宽度为父元素content宽度减去浮动元素，如果长度超出，会被分为多个块。用途在于水平垂直居中，生成IFC设置，text-align center则水平居中，设置一个辅助元素高度为父元素的高度，再设置vertical-align为middle即可。
- 你还知道哪些FC？display:grid  GFC栅格布局，当 display 的值为 flex 或 inline-flex 时，将生成弹性容器 FFC。

BFC可以被引申的知识点：

- margin重叠。
- 清理浮动。
- 文字环绕以及，解除文字环绕。

***概述媒体查询***

可在link标签的media属性上设置媒体查询，也可以在样式表中使用@media使用媒体查询，这里需要注意的是浏览器不会根据媒体查询是否命中去选择是否加载资源。有很多的媒体属性，如果是与值相关的媒体属性一般会加min或者max前缀，其中最常用的是width，比较常用的是print，有时候我们可能希望打印时可以去掉非主体部分，orientation屏幕的方向，主要在手机端，可以将媒体属性与媒体查询中的逻辑表达式搭配。经常使用max-width，和min-width，实现响应式布局，

***概述视窗***

答：viewport是一个meta属性，它的content可以包含width , initial-scale, maximum-scale, user-scalable, 同样也有minimum-scale。视口是我们一次性能看到的最大的逻辑像素，比如一个200px宽的图片在100px的视口最多只能看到100px。device-width是一个特殊值，但并不能运算，device-width/2是无效的。scale是相对逻辑像素的scale，当设置了scale是1时，那么320px的就是占320个逻辑像素，跟视口无关。如果不设置scale那么一般来说会默认展示视口内的所有内容，除非**视口过宽，移动端可能会展示横向滚动条**。一般来说使用一个设计宽度去固定根元素宽度（rem），这个宽度换算成px后与视口宽度一致，内部元素也用rem保证与根元素相对相对大小。

引申：

- 在处理高分屏和低分屏的时候应该注意什么？答：选择以高分屏宽度为设计宽度时，以此设计宽度作为视口宽度时，在低分屏会产生横向滚动条，所以在低分屏要将视口宽度减半，根字体大小也相应减半。还有一点是因为devicePixelRatio大于1的原因，高分屏中的1px不是可以显示的最细的线，不少开发者为了追求美观使用一些方法（有很多方法https://www.jianshu.com/p/7e63f5a32636），根据优雅降级的原则，需要额外留意低分屏的显示并酌情调整。

***什么是devicePixelRatio？***

答：在高分辨率的屏幕里，每个由于像素比较密集，逻辑像素与物理像素不是一一对应的，会有一个比例，如果一个逻辑像素为2*2个物理像素，那么devicePixelRatio为2。

***a标签有哪些伪类？***

答：link，visited，hover，active。

引申：

- 这些伪类的书写顺序是什么？答：如上。
- 优先级为什么是这样的？答：伪类没有任何魔法，在命中一个伪类的时候可能会命中另一个伪类，如active伪类生效时，hover伪类一定生效，如果此时将hover写在后面，根据css的层叠特性此时active对应的样式不生效，不符合预期，顺序实际上是“由一般到特殊”的顺序。

***写一个选择器选择href拓展名为pdf文件的a标签？***

答：a[href$=".pdf"]，用了属性选择器的$=选择以""内部内容结尾的标签。

***单行省略号与多行省略号分别如何实现？***

TODO

***如何实现自动生成有序主标题副标题？***

答：使用counter-reset和counter-increment以及伪元素的counter表达式（在本人随笔2中提及）。如下：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title></title>
  </head>
  <style media="screen">
    body {
      counter-reset: foo;
    }

    h1 {
      counter-reset: bar;
    }

    h1:before {
      counter-increment: foo;
      content: "Section " counter(foo) ". ";
    }

    h2:before {
      counter-increment: bar;
      content: counter(foo) "." counter(bar) " ";
    }
  </style>
  <body>
    <!-- <a href="baidu.com">baidu</a>
    <a href="sina.com">sina</a> -->
    <h1></h1>
    <h2></h2>
    <h2></h2>
    <h2></h2>
    <h1></h1>
    <h2></h2>
    <h2></h2>
    <h1></h1>
    <h2></h2>
    <h2></h2>
    <h1></h1>
    <h2></h2>
    <h2></h2>
  </body>
</html>
```


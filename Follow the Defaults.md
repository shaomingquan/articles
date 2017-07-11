***这是思维方式***

之前在开发中总是没有这样的思想：浏览器是个平台，有时候它可以帮你做很多事。浏览器总类繁多，兼容性体现在html，css，js上面，js带来的兼容性问题尤其具有“杀伤性”，但是html和css的兼容性问题却很友好，没有破坏性，css和html在遇到不能解析的部分并不会抛出错误，具有很强的渐进增强和优雅降级的特性。

在css和html中follow the defaults有时候会带来用户体验上的小惊喜，且是js达不到的，或许也只是在个别平台上，但则足以让人感受到兴奋。


***js本身为了完成逻辑就很复杂了，需求首先想到从html和css解决，更稳定快速，且好维护。***

***没什么干货，只是警示自己不要在茫茫前端技术中走偏了***。提三点。

#### 别盲目升级
新人往往犯得问题。容易被市场带节奏，而这个节奏不一定适合你的项目。

一个简单的文档站就不需要复杂的SPA框架，重在方便的编写发布，这时候弄SPA就是乱折腾。

能用dom和css实现的就别用canvas+js，除非有很大的性能瓶颈。

**最新最好的不一定是最适合的，大牛造轮子的初衷也是基于业务。**

#### 选型顺序

思考的顺序应该是 ***meta -> html -> css -> js***。

比如做页面内跳转尽量使用hash，而不是得到位置再scrollTop。

无需复杂交互使用input 的 required属性做验证，而不是`input.value == ''`。

能使用hover伪类别使用mouseover事件。

能用http-equiv的不要再server端setHeader。

类似的例子很多，使用不合理的技术选型往往没有遵循follow the default原则。

#### 几个案例

##### 键盘

就像针对ios，apple提供了很多支持，优化了web浏览。这类往往由native实现，开发者可以加一些meta或者属性进行控制，当开发移动端的时候尤为重要，而成本只是阅读一些文档，就可以**发挥平台的能力**。
https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html#//apple_ref/doc/uid/TP40008193-SW2

最简单的例子。下面三个图使用不同的`input[attr]`。当iPhone唤起键盘的时候，会有不同的结果。依次为type=email，type=text，type=number。这只是个小例子，也就是别动辄text。

##### 跳转

这是最近我自己踩的一个坑。用h5的history API自己设计的单页应用路由，没成想当我想用command + 左click的组合键的时候，并没有像我想象的打开一个新tab。一个激灵后我意识到了，当初设计路由的时候应该想到**a标签的默认行为给浏览器平台的体验**。

##### 去AppStore下载app

只需加一个meta，就可以请求Safari去添加一个网站对应app的下载链接，https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/PromotingAppswithAppBanners/PromotingAppswithAppBanners.html     这其实是一种web和native通信的策略。
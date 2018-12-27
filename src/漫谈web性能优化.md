> 当我们提及web的时候，正是在浏览器中的一个个的站点。作为web开发者，最终目标是让用户在加载时够快，浏览时更顺畅。下面会比较宏观的讲web性能优化，每个点不会纠结的很细。

### 从一个页面的加载过程说起

[https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API/Using_the_Resource_Timing_API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API/Using_the_Resource_Timing_API)

上面链接中的图可以描述我们从输入网址、到页面渲染、到页面可以使用的一个过程。

按照Google Analytics（下面称GA）的套路，把指标分为三大类，以下来自GA。

- “网站使用情况”：基本的互动指标，例如网页浏览量和跳出率
- “技术”：网络和服务器指标
- “DOM 计时”：文档解析指标

当然这里的第一项偏向于运营效果，尽管这个很重要，但技术更应该关心的是后两个维度，在这两个维度上观察的重点可能会不同。

在“技术”中：

- 重定向时间
- dns解析时间
- tcp（ssl）链接建立时间
- 服务器相应时间（ttfb：time to first byte）
- 页面下载时间
- 页面加载时间

在“DOM 计时”中：

- 文档进入可交互状态时间（domInteractive）
- 文档内容加载时间（domContentLoaded）
- 页面加载时间（domComplete）

以上前两个尤其容易弄混。这涉及到[关键渲染路径](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp?hl=zh-cn)。

- domInteractive 表示 DOM 准备就绪的时间点。
- domContentLoaded 一般表示 DOM 和 CSSOM 均准备就绪的时间点。如果没有阻塞解析器的 JavaScript，则 DOMContentLoaded 将在 domInteractive 后立即触发。（当我把css变得更复杂的时候，两个事件的间隔边长）
- domComplete 表示网页及其所有子资源都准备就绪的时间点。

而如下mdn上的解释或多或少会有些问题。应该为`document.readyState === "complete"`。

```js
// alternative to DOMContentLoaded event
document.onreadystatechange = function () {
  if (document.readyState === "interactive") {
    initApplication();
  }
}
```


### 其他资源

当然，以上是针对**主文档的**，页面上还有很多其他浏览所需的必要资源，

**TODO**

#### web性能优化的几个方向。

前端：

- 代码原则。
- 细节分析。

后端：

- 多实例。
- IO模型。

网络：

- 协议。

#### 优化通用方法论

- 合并。（使用cdn的combo服务）
- 并行。（域名发散，webworker）
- 拆分。（域名收敛）
- 有度。（域名发散，域名收敛的平衡）
- 缓存。（注意缓存的命中率）
- 采样。（在计算中，接受误差允许则可采用采样）

（闪念）

http内容压缩 gzip referrer策略 zero cookie的专用域。

#### 工具

- [https://github.com/w3c/longtasks](https://github.com/w3c/longtasks)
- chrome 拓展应用：Performance-Analyser。

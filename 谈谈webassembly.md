***What?***

WebAssembly 下文简称 wasm。

wasm旨在提速。同时保证了代码可读可调试，运行安全友好。

javascript是运行在JIT中通过API与浏览器进行交互的，通常情况下没有性能瓶颈，但处理大型3D，虚拟现实，增强现实等程序，这种方式就力不从心了。

可以感受得到，使用javascript运行的webgl游戏，尽管从画面效果上与大型游戏相比还是捉襟见肘，但电脑还是热得夸张。wasm可以解决这个问题，这是对web平台极大的提升，搭配pwa再加上现代浏览器现代设备对于web良好的展示，势必对app会是极大的冲击。[官方推荐用例](http://webassembly.org/docs/use-cases/)。

***WASM vs JS***

按官方的说法，wasm不是javascript的替代品，它与javascript一同工作，是对web平台的补充。所以有了[wasm的jsapi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly)。可以吧wasm看成是当成js的加速器。

wasm还不支持访问dom，在未来，有计划让wasm调用javascript，以此调用js支持的api，目的是因为wasm无法调用web的api，所以在wasm可以调用javascript的时候，会有js胶水代码帮助wasm调用webapi，让wasm甚至可以脱离javascript（除了加载wasm和加载胶水js依赖），就完成整个web应用。**可能直接在c++中实现webapi的成本太大，如果每种语言都实现webapi，就不如去做胶水**。

显然，这种机制的出现可以让c++（或者其他语言）直接实现web应用，**而实际上语言上的瓶颈对比dom操作的瓶颈来说，还是微不足道的**。

![](/images/1497775356il.png)


wasm实现了c++中的 SDL, OpenGL, OpenAL, 部分的 POSIX。代码最终还是要跑在客户端，所以可见很多功能实际上是被阉割的，好在OpenGL可以在canvas中运行，**所以我觉得，wasm的出现，对于h5游戏的开发会有提升**。

***Guess Future***

- h5游戏搭配wasm会有很大的潜力，甚至搭配pwa，让h5游戏可以处理更重的情景。
- 对js的冲击，按照现在js的份额（高），js的灵活性（高），以及目前大部分js web应用的瓶颈问题（没明显瓶颈），时下的情况不足以让
- 企业级产品或许可以投入精英人力搞基于wasm的应用，可以提高企业级web应用的体验。
- c端业务以及活动需要的敏捷度、人力情况以及产品瓶颈都不允许团队大力搞wasm。（招个靠谱的js已经很难了）。





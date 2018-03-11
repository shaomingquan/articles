### what?

最流行的数据流管理工具。作者目前被收入react项目组。

### why?

使用redux可以享受

- 数据流框架红利。
- redux红利。

关于第一点，因为它是数据流管理工具，相比于mvc，在前端领域的构架，数据流模式更有优势，以及我也整理了关于[数据流的红利](https://github.com/shaomingquan/articles/blob/master/%E4%BD%BF%E7%94%A8%E6%95%B0%E6%8D%AE%E6%B5%81%E7%AE%A1%E7%90%86%E5%BA%93.md)。关于第二点：

- 流行程度、优秀的社区。
- 纯函数的概念。
- 单一store。

约束较多或者较少，看各自喜好，各类特性也是。

### 带看思路

从一个最简单的例子入手吧！所以一下子不需要看所有的功能，使用createStore就可以实现一个最基本的东西。再加上redux和redux-react一起，可以实现与react框架的高效绑定。在实现大型项目的时候，需要做一些架构上的优化，这时候需要一些设计模式，redux会提供一些非核心功能去做这些事。

- 关于createStore。[示例代码](https://github.com/mocheng/react-and-redux/tree/master/chapter-03/redux_basic)。
- redux和redux-react。[示例代码](https://github.com/mocheng/react-and-redux/tree/master/chapter-03/react-redux)。
- redux高阶功能。

### createStore

redux的设计有些渐进式的意味，当createStore只应用前两个参数时，使用的是redux的基本功能。实际上redux实现了一个低配版的事件订阅模式，源码不难，有几个优秀的设计以及几个需要注意的点。

***关键变量isDispatching。*** 如果isDispatching===true，不允许执行getState，不可以subscribe或者unsubscribe，不可以开始下一波派发。

***ensureCanMutateNextListeners函数***。 在reducer执行完毕之后isDispatching===true，此时执行订阅函数列表。此时isDispatching的限制解除，不过subscribe或者unsubscribe时，列表需要在下一次dispatching时生效。

dispatch的action只支持纯对象，对象要求必须有type字段。（解决使用redux-thunk，具体怎么做？什么场景下使用？TODO）

在源码中，reducer的执行与返回下一个state是同步执行的，那么如果有异步的东西要怎么办？（用redux-thunk，需要中间件模式对特殊模式的action做拦截处理，涉及到中间件模型，下面说，TODO）。

### redux-react

redux-react基于[容器组件和展示组件相分离](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)的开发思想，作用：

- 使用react的context特性让store穿透到下游组件。
- 使用connect函数去封装容器组件逻辑，让代码结构更清晰。

connect最终的落脚点是返回一个HOC（高阶组件），这个组件的render方法使用react的createElement方法以及展示组件配合mapStateToProps阐释的props输出vdom。

在执行onStateChange方法的时候使用setState设置一个空的傀儡state只为了触发vdom重新计算，这时会重新计算props。

会默认使用shouldComponentUpdate声明周期进行优化。使用shallowEqual判断是否需要更新。

使用[reselector](http://cn.redux.js.org/docs/recipes/ComputingDerivedData.html)优化props计算效率。
---
date: 2020-10-06
tags: js
---

> 过去两年都在搞mobx，最近重温了一下redux。

**准备开始用用redux了**

## 老生常谈的优点

- immutable
- 易追踪
- 易序列化
- 中间件机制
- 易学习
- ...

> 可能从体感上 mobx更易学习，但从原理以及设计角度，mobx要精密得多，同时因为精密可能也会有潜在的风险

## 依赖位置

mobx的优点也正是它最大的缺点，**“悄无声息的observe”**，甚至官方都不推荐把observer所依赖的observable都写在前面，依赖可以在if else逻辑中，按官方的说法这样可以少建立一些依赖。只要在view中get了某store的某observable，依赖就绑定上了，等下一次view更新时真正的依赖可能就变了。

redux恰恰要求view的依赖必须是显示的，无论是使用connect hoc还是用hook的方式，**相对于view的主逻辑，依赖声明总是前置**。相比于mobx，更容易维护一些。

## view侵入

mobx推荐用Provider和inject来做store的依赖注入，因为注入的是整个store，所以其实view的主逻辑对store的依赖比较强，还是因为所有的subscribe/dispatch逻辑是隐式的，导致**这个view在去掉mobx的store之后几乎不可迁移**。mobx view侵入程度是偏大的。

使用redux的connect去与view做链接，拿react举例，connect把view当作最普通的组件来处理，**摘除connect就可以任意被使用**。相比于mobx，redux与view的耦合度小，侵入感低。

## redux的担心&吐槽&解决方案

1，统一store，业务量太大时内存占用过大。方案：封装reset方法，必要时page销毁时调用reset，如果都这样做就没啥内存风险，最大就一个页面的内存。

2，connect性能问题，mapstatetoprops在每次dispatch都会重新求值。方案：使用reselect即可解决

3，庞大的reducer，这个暂时没遇到性能问题，不过业务庞大之后，特别是多层combineReducer之后，整个reducer的量级还是触目惊心。这个也简单，只要按一定的规范去写action，就可以按照action.type描述的位置找到最小reducer。

## 这次开搞redux了

与时俱进，跟随官方，结合项目

- 用redux-toolkit
    - 并在文件命名上参考了dva
    - 使用Hook+FunctionalComponent
- 考虑到后续项目可能会很庞大，pages和stores的目录结构都是双层的

每个store文件夹下面有：

- index：基础的同步reducers和同步actions
- effects：异步actions（ThunkActions）
- derived：衍生值，reselect的selector
- subscriptions：非view dispatch的订阅

> 具体看redux-toolkit吧
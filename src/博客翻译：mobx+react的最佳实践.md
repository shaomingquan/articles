---
date: 2019-06-10
tags: 翻译
---

> 原文：https://iconof.com/best-practices-for-mobx-with-react/

这是我为那些刚刚使用Mobx来搭配React的朋友们准备的8条有用的建议和最佳实践。它的意图不是对Mobx进行介绍，并且假定读者已经对Mobx的[关键概念](https://mobx.js.org/intro/overview.html)很熟悉。

1，从可观察状态建模开始

在担心其他事情之前，将你的可观察状态建模（那些驱动UI的数据），需要铭记于心的是你的app需要运作的正是这些可观察状态，这不意味着需要原封不动的将你的数据库（表/文档）对应过来。下一步是找出那些跟随副作用产生的必要的action。

> 建模，modelling，组织状态数据结构。副作用也就是事件，网络之类的。

2，拥抱衍生状态（计算属性）

在给核心可观察状态建模之后，思考一下衍生状态，这意味着思考你的观察者（你的UI）将如何消费你的可观察状态，目标是给你的观察者提供一个语义化的接口。通过暴露计算属性，来替代对核心可观察状态做底层的操作。

如果你发现自己在做像如下的事情：

```js
// 从可变数组衍生值
store.array.forEach()
store.array.reduce()
store.array.filter()
store.array.find()

// 检查数组的长度
if (store.array.length > 0) {
  ...
}

// 组合数据
const fullname = store.firstname + store.lastname
```

或者从本质上说，如果你从store获得的值不是你想最终渲染到UI上的，那么看起来它更适合使用计算属性。

- 如果你需要处理数组，你的store应该提供你想要的结果。
- 如果你想要检查数组是否有元素，你的store应该提供一个isEmpty属性。
- 如果你想要一个组合属性（举例 firstName + lastName 得到 fullName，你的store应该提供一个叫fullName的计算属性）。
- ...

实际上，你从store获得的数据应该是直接可用的，无需任何额外处理。无需担心这方面性能，Mobx在计算属性方面非常高效。

> 计算属性不能被低估，因为它们帮助你把状态变更拆的尽可能小，除此之外它们也被高度优化，所以要在尽可能多的场景使用它们。 - [Mobx](https://mobx.js.org/refguide/computed-decorator.html)

> 如果任何影响计算值的值发生变化了，计算值将根据状态自动进行衍生。 计算值在大多数情况下可以被 MobX 优化的，因为它们被认为是纯函数。 例如，如果前一个计算中使用的数据没有更改，计算属性将不会重新运行。 - [Mobx](https://mobx.js.org/refguide/computed-decorator.html)

3，拥抱可变性

你可能会认为Mobx是一个状态管理工具，但是它的作者又继续开发了[Immer](https://github.com/mweststrate/immer)（一个关于不可变性和函数式编程的库）。你的假设或许是有根据的，基于你之前在其他状态管理库上的经验，像Redux，它也有在不可变性上的加强。

Mobx不是那样的库。

Mobx创建了可变的对象，你可以直接改变它并且应该改变它，它仍然可以让你去创建高效的状态及，它仅仅是没有用不可变数据结构。

> 作者是想说，Immer不是为mobx服务，即使没有不可变数据，不影响它的基础功能。高级功能自便。

4，使用严格模式

Mobx允许你使用两种方式改变state，直接改变或者使用action改变。

```js
// mutate directly
store.valueA = 5;
store.valueB = 10;

// mutate in an action
action() {
  this.valueA = 5;
  this.valueB = 10;
}
```

当你使用action改变状态时：

- 提高了代码的可读性：
    - 让你的意图更清楚（“我有意的改变一个可观察状态，不仅仅是任意对象”），这会让你在未来需要重新看这块代码时变得更轻松。
    - 让你的app更加声明式。包装一系列的变更在同一个action中，你可以使用一个更有意义的名字，无论是关于UI还是关于这个操作。
- 提高性能。通过把一系列的变更合并为一个原子操作，当所有的可观察状态被改变之后，只有一个变更通知被触发。
- 让调试更简单。结合Mobx的开发工具。

在[严格模式](https://github.com/mobxjs/mobx/blob/gh-pages/docs/refguide/api.md#enforceactions)中，你只可以通过action变更可观察状态，否则Mobx会返回一个错误。

使用下面代码开启严格模式：

```js
import { observable, configure } from 'mobx'

configure({ enforceActions: 'observed' })
```

5，保持你的action在Mobx store中

在选择action的位置方面有两种可选方法：

A. 更靠近那些需要它们的组件

一个方法是把action定义在组件代码或者工具模块中（即action与react组件定义在同一个文件中），这是一个最简单的方式并且可以让你在开发app的过程中更快的复用逻辑。

思考一下当你的app量级增大时会发生什么。

你可能最终会面对一个不可控制的action网络，这些action会在很多地方被触发，并且更改store。

- 如何对这些action保持跟踪？
- 如果简单的重构它们？
- 如何避免代码重复，当不止同一个组件使用相同的action？

需要记住的是，当action被分散到不同的文件中时，你还必须把store做更多额外的传递。（作者似乎想说，需要传递更多的store，更费力）。

B. 更靠近store（推荐）

力争保持所有的action在同一个位置，并且离你的store更近。当你只需要关注一个位置时，会帮助你对“发生了什么”保持跟踪，并且更好的调试。把action与store定义在同一个文件中，最好的方法是作为store的一个方法来定义。

```js
class Person {
  @observable name = ''

  @action setName(name) {
    this.name = name
  }
}

const person = new Person()
person.setName('Kostas')
```

5，Class语法 vs Object语法

Mobx允许你使用Class和Object声明可观察状态，这里有三个例子：

1，Class语法搭配@observable，@computed和@action装饰器：

```js
class OrderLine {
  @observable price = 0
  @observable amount = 1

  constructor(price) {
    this.price = price
  }

  @computed get total() {
    return this.price * this.amount
  }

  @action setPrice(price) {
    this.price = price
  }
}
```

2，Class语法搭配decorate()方法：

```js
class OrderLine {
  price = 0
  amount = 1

  constructor(price) {
    this.price = price
  }

  get total() {
    return this.price * this.amount
  }

  setPrice(price) {
    this.price = price
  }
}
decorate(OrderLine, {
  price: observable,
  amount: observable,
  total: computed,
  setPrice: action
})
```

3，observable.object语法：

```js
const orderLine = observable.object(
  {
    price: 0,
    amount: 1,
    get total() {
      return this.price * this.amount
    },
    setPrice(price) {
      this.price = price
    }
  },
  {
    setPrice: action
  }
)
```

应该选择哪一个？关系不大。Mobx对这三种方式支持的都很好，你不会失去任何功能。它仅仅关乎代码风格和[工具链](https://mobx.js.org/best/decorators.html)（例如 你的开发环境必须支持装饰器当使用@observable语法的时候，等等）。所以为你的自己你的项目你的团队选择一个最好的方式，一旦选择了，就保持一致。

7，注入store，而不是import

当你想在某个React组件中使用store时，你可以只是把它导入`import store from './store.js'`并且访问它的属性。这种方式在功能上没有什么问题，但是会有一些缺点：

- 它不符合Mobx的语法习惯。当你使用一个工具，但是做的事情却偏离它的推荐方式，这可能会让团队成员和未来的维护者困惑。
- 它不那么声明式。你引入了一些模块，而不是显示的注入了一个store（作者的意思是，inject这样的做法声明式更强，确实更便于与普通的import区分）。
- 它更难被测试。
- 它更难做服务端渲染。

你可能有个不使用的原因，确认它是一个好的原因。

推荐的方式是使用由[mobx-react](https://github.com/mobxjs/mobx-react)提供的Provider和inject。

> Provider 是一个使用React的[context API](https://reactjs.org/docs/context.html)把store（或者其他东西）传递给后代组件的组件。它特别有用，当你不想逐层透传多级组件的时候。

> inject 可以用来选择那些store。它是一个参数为字符串列表的高阶组件，并且可以让store对于被封装的组件可见。

提供一个或多个store在父组件中：

```js
...
<Provider productStore={ProductStore} uiStore={UiStore}>
  <div>{children}</div>
</Provider>
...
```

Inject 从context中拿到被提供的store，并且可以使用props获取它们。举个例子`inject('productStore')`会把productStore从context拿出来，并且可以使用`this.props.productStore`访问它。

8. mobx-state-tree (MST)

正如你可能意识到的，Mobx十分灵活并且你可以用各式各样的方式使用它。如果您正在寻找用法更灵活的替代方案，可以看下[mobx-state-tree](https://github.com/mobxjs/mobx-state-tree)。

> 灵活，支持事务，Mobx驱动的state容器结合不可变性和可变性的的最佳特性。

> get 不到作者是想说啥？“Opinionated”这个在这里要怎么解读。

MST强制使用一致性，支持强类型的可观察状态，并且它与纯粹的Mobx很不一样，所以这里有一定的学习曲线。

学习更多

如果你想学习更多关于Mobx的知识，我推荐下面的资源。使用[官方文档](https://mobx.js.org/index.html)来入门，它非常好并且我认为它值得去通读至少一遍。

一些优质资源：

- [MobX Common pitfalls & best practices](https://mobx.js.org/best/pitfalls.html)
- [Best MobX Practices for building large scale maintainable projects](https://mobx.js.org/best/store.html)
- [Optimizing rendering React components for MobX](https://mobx.js.org/best/react-performance.html)
- [What does MobX react to?](https://mobx.js.org/best/react.html)

要记住mobx-react是一个独立的包，这里是[它的文档](https://github.com/mobxjs/mobx-react)。

书籍：

- [MobX Quick Start Guide](https://www.packtpub.com/web-development/mobx-quick-start-guide)

文章：

- [MobX React—Best practices](https://medium.com/dailyjs/mobx-react-best-practices-17e01cec4140)
- [The fundamental principles behind MobX](https://hackernoon.com/the-fundamental-principles-behind-mobx-7a725f71f3e8)
- [Becoming fully reactive: an in-depth explanation of MobX](https://hackernoon.com/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254)

[作者推特](https://twitter.com/mavropalias)

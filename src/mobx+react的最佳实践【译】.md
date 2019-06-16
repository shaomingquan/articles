> 原文：https://iconof.com/best-practices-for-mobx-with-react/

这是我为那些刚刚使用Mobx搭配React的朋友们准备的8条有用的建议和最佳实践。它的意图不是对Mobx进行介绍，并且假定读者已经对Mobx的关键概念很熟悉。

1，从可变状态建模开始

在担心其他事情之前，将你的可变状态建模（那些驱动UI的数据），需要铭记于心的是你的app需要运作的正是这些可变状态，这不意味着需要原封不动的将你的数据库（表/文档）对应过来。下一步是找出那些跟随副作用产生的必要的action。

> 建模，modelling，组织状态数据结构。副作用也就是点击，网络之类的。

2，拥抱衍生状态（计算属性）

在给核心可变状态建模之后，思考一下衍生状态，这意味着思考你的观察者（你的UI）将如何消费你的可变状态，目标是给你的观察者提供一个语义化的接口。通过暴露计算属性，来替代对核心可变状态做底层的操作。

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

或者从本质上说，你从store获得的值不是你想最终渲染到UI上的，那么看起来它更适合使用计算属性。

- 如果你需要处理数组，你的store应该提供你想要的结果。
- 如果你想要检查数组是否有元素，你的store应该提供一个isEmpty属性。
- 如果你想要一个组合属性（举例 firstName + lastName 得到 fullName，你的store应该提供一个叫fullName的计算属性）。
- ...

实际上，你从store获得的数据应该是直接可用的，无需任何额外处理。无需担心这方面性能，Mobx在计算属性方面非常高效。

> 计算属性不能被低估，因为它们帮助你把状态变更拆的尽可能小，除此之外它们也被高度优化，所以要在尽可能多的场景使用它们。 - Mobx

> 如果任何影响计算值的值发生变化了，计算值将根据状态自动进行衍生。 计算值在大多数情况下可以被 MobX 优化的，因为它们被认为是纯函数。 例如，如果前一个计算中使用的数据没有更改，计算属性将不会重新运行。 - Mobx

3，拥抱可变性

你可能会认为Mobx是一个状态管理工具，它的作者又继续开发了Immer，它是一个关于不可变性和函数式编程的库。你的假设或许是有根据的，基于你之前在其他状态管理库上的经验，像Redux，它在不可变性上是加强了的。

Mobx不是那样的库。

Mobx创建了可变的对象，你可以直接改变它并且应该改变它，它仍然可以让你去创建高效的状态及，它仅仅是没有用不可变数据结构。

> 作者是想说，即使没有不可变数据，不影响它的基础功能。高级功能自便。

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
    - 让你的意图更清楚（“我有意的改变一个可变状态，不仅仅是任意对象”），这会让你在未来需要重新看这块代码时变得更轻松。
    - 让你的app更加声明式。包装一系列的变更在同一个action中，允许你使用一个更有意义的名字，无论是对UI还是对于这个操作。
- 提高性能。通过把一系列的变更合并为一个原子操作，当所有的可变状态被改变之后，只有一个变更通知被触发。
- 让调试更简单。结合Mobx的开发工具。

在严格模式中，你只可以通过action变更可变状态，否则Mobx会返回一个错误。

使用下面代码开启严格模式：

```js
import { observable, configure } from 'mobx'

// 'observed' is the recommended strictness mode in non-trivial applications.
configure({ enforceActions: 'observed' })
```

5，保持你的action在Mobx store中

在选择定义action的位置方面有两个可选择的方法：

A. 更靠近那些需要它们的组件

一个方法是把action定义在组件代码或者工具模块中（即action与react组件定义在同一个文件中），这是一个最简单的方式并且可以让你在开发app的过程中更快的复用逻辑。

思考一下当你的app量级增大时会发生什么。

你可能最终会面对一个不可控制的action网络，这些action会在很多地方被触发，并且更改store。

- 如何对这些action保持跟踪？
- 如果简单的重构它们？
- 如何避免代码重复，当不止同一个组件使用相同的action？

需要记住的是，当action被分散到不同的文件中时，你也将不得不传store进去。

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

Mobx允许你使用Class和Object声明可变状态，这里有三个例子：

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

应该选择哪一个？关系不大。Mobx对这三种方式支持的都很好，你不会失去任何功能。它仅仅关乎代码风格和工具链（例如 你的开发环境必须支持装饰器当使用@observable语法的时候，等等）。所以为你的自己你的项目你的团队选择一个最好的方式，一旦选择了，就保持一致。

7，注入store，而不是import
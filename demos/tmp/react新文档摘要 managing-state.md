## 前言

app越大，付出更多在数据流管理就更值得。

冗余重复的状态经常会造成一些bug。

学习目的：保持状态更新可维护，组件间share状态

### Reacting to input with state

解释了react的相应式：不修改ui，描述ui，在事件中变更状态

### Choosing the state structure

state的结构，重要原则，不冗余，不重复。举例fullName

## Choosing the State Structure

> 组织state

更好的组织state会有更好的开发和debug体验，下面就是一些需要考虑的点：

- single还是multiple。When to use a single vs multiple state variables
- 需要避免什么。What to avoid when organizing state
- 一些共通问题的处理。How to fix common issues with the state structure

### Principles for structuring state

点出两个问题：

- how many state variables to use
- what the shape of their data should be

一些原则：

- Group related state. 如果总是在同一时间更新两个状态，就跟他们放在一起.
- Avoid contradictions in state. 坚持一种方式，否则可能在埋雷（leave room for mistake）
- Avoid redundant state. 能用其他state派生就不要存
- Avoid duplication in state. 少一些对象复制（拷贝？），同步很困难（数据扁平化？）
- Avoid deeply nested state. 因为不方便，尽可能扁平

这些原则的目的是让state更新更简单不出错. Removing redundant and duplicate 帮助state保持同步. 就像数据库工程师为了减少bug，让database的结构更标准. 引用爱因斯坦的话, “让你的状态尽可能的简单，除非没有更简单的了”

### Group related state

if some two state variables always change together, it might be a good idea to unify them into a single state variable.

总是一起变？就放一起

另一种需要group状态的case，动态成员的表单，数组

陷阱：

不copy是无法update状态的。用一个解构作为例子

### Avoid contradictions in state

举了个例子解释矛盾状态：both isSending and isSent are true
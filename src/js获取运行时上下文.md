---
date: 2021-08-24
tags: js
---

今天想做一个给分页信息持久化到localStorage的事。我有个通用的分页Store（PaginationStore），其他业务Store都会声明一个这个Store的实例，以复用其逻辑。按传统的做法，业务在声明PaginationStore实例的时候，给一个特定的存储key，很容易就实现这个功能。但是这样要改太多文件了，因为每个业务Store都在使用PaginationStore的实例，那么可以自动的拿到一个key吗？且在不同业务中这个key不同且不变？以作为Pagination被特定业务实例化的标示。

答案就是 [stackTraceApi](https://v8.dev/docs/stack-trace-api)。利用`prepareStackTrace`，可以获得callStack的js对象数组，利用这个数组，可以很容易的拼接出一个运行时的唯一串，有些类似html中的xpath。

```js
var callsites = () => {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const dummyE = new Error('DUMMY');
    const stack = dummyE.stack.slice(1); // 最里面这一层不要
    Error.prepareStackTrace = _prepareStackTrace;
    return stack;
};

// callsites()
/**
0: CallSite {}
1: CallSite {}
length: 2
__proto__: Array(0) 

这玩意叫CallSite，每个callSite实例都有下面的方法
constructor: ƒ CallSite()
getColumnNumber: ƒ getColumnNumber()
getEnclosingColumnNumber: ƒ getEnclosingColumnNumber()
getEnclosingLineNumber: ƒ getEnclosingLineNumber()
getEvalOrigin: ƒ getEvalOrigin()
getFileName: ƒ getFileName()
getFunction: ƒ getFunction()
getFunctionName: ƒ getFunctionName()
getLineNumber: ƒ getLineNumber()
getMethodName: ƒ getMethodName()
getPosition: ƒ getPosition()
getPromiseIndex: ƒ getPromiseIndex()
getScriptNameOrSourceURL: ƒ getScriptNameOrSourceURL()
getThis: ƒ getThis()
getTypeName: ƒ getTypeName()
isAsync: ƒ isAsync()
isConstructor: ƒ isConstructor()
isEval: ƒ isEval()
isNative: ƒ isNative()
isPromiseAll: ƒ isPromiseAll()
isToplevel: ƒ isToplevel()
toString: ƒ toString()
__proto__: Object
* /
```

实践中应注意压缩的时候忽略函数名，混淆后就不好用了，且别用行列index拼key。具体的实现方式比较灵活，可各取所需。那么nodejs的module的parent属性能做这个事吗？不能。nodejs跟webpack runtime类似，module都是首次执行，后续从缓存调取，parent记录的是首次执行时的调用者，比如下面示例：

```js
// lib2.js
// just打印
module.exports = () => {
    console.log(module.parent.filename)
}

// index3.js
// just执行lib2
require('./lib2')()

// index4.js
// 执行lib2，且引用index3
require('./lib2')()
require('./index3')
```

执行`node index4.js`，`console.log(module.parent.filename)`会执行两次，两次打印的结果都是`index4.js`（显然这很正常），但其实parent这属性有点意义不明，且在某些case中还有潜在内存泄漏问题。看看最近的文档，已经Deprecated了：

```md
module.parent

Added in: v0.1.16 Deprecated since: v14.6.0, v12.19.0

Stability: 0 - Deprecated: Please use require.main and module.children instead.

<module> | <null> | <undefined>

The module that first required this one, or null if the current module is the entry point of the current process, or undefined if the module was loaded by something that is not a CommonJS module (E.G.: REPL or import).
```
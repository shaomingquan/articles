---
date: 2021-07-17
tags: js
---

> 泛型约束为前置知识

在实际开发中，很常见的需要多个泛型共同约束的情况，像是下面的代码：

```ts
type TStore = {[key: string]: any}

class C<S extends TStore> {
    foo<K extends keyof S, V extends S[K]>(k: K, v: V) {}
}
```

K，V也被S约束，这个约束形成了一种传递。在看看下面的bar与上面foo的区别

```ts
type TStore = {[key: string]: any}

class C<S extends TStore> {
    foo<K extends keyof S, V extends S[K]>(k: K, v: V) {}
    bar<K extends keyof S, V extends S[keyof S]>(k: K, v: V) {}
}
```

***“传递”与“分叉”***：

- foo当中，V是受K约束的，K受S约束，整个约束链路是`S -> K -> V`。
- bar当中，V和K分别受S约束，有两个约束链路`S -> K, S -> V`。

这会影响我们的实际应用，如下：

```ts
type TMyStore = {a: 1, b: 2}
const c = new C<TMyStore>()
c.foo('a', 1) // 不报错，K，V满足约束
c.foo('b', 1) // 报错，K，V不满足约束
c.foo('b', 2) // 不报错，K，V满足约束

// 下面都不报错，K，V分别满足S的约束，互相不约束
c.bar('a', 1) 
c.bar('b', 1)
```

至于两种方式的选择，具体场景具体分析。像是上面的S是indexable map这种场景，本身表达了k和v的约束，所以“传递”更适合。
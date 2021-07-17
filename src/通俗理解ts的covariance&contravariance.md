---
date: 2021-06-29
tags: js
---

不知道covariance&contravariance可以看 https://www.stephanboyer.com/post/132/what-are-covariance-and-contravariance。

假设有三个类型`Greyhound, Dog, Animal`，Greyhound是Dog的子类型，Dog是Animal的子类型，那么在ts中，可能会有下面用法：

```js
const gh = new Greyhound
const dog: Dog = gh
```

通俗来讲，***gh是Greyhound所以它也是Dog***。ts是符合直觉和**类型安全**的，由此可以总结，对于赋值运算`a = b`成立，则b与a类型一致，或者b是a的子类型。对于简单的类型，这很好理解，对于**复杂ts类型，则需要了解下covariance&contravariance**。上面的文章也没有详细解释covariance&contravariance，作者用一个问题引出这两个概念。问题：以下哪种类型是 Dog → Dog 的子类型呢？

```
Greyhound → Greyhound
Greyhound → Animal
Animal → Animal
Animal → Greyhound
```

答案是最后一个，比较容易发现，对于合成类型的子类型判定，与参数类型的判定是相反的（contravariance），与返回值类型的判定是相同的（covariance）。理解这个还是要从类型安全角度出发，上面提过如果a = b可以赋值成功说明：

- 1，b是a的子类型
- 2，b赋值给a是安全的

对于类型安全，通俗来讲b的类型能兼容a的类型，在这个方面参数和返回值两者理解有所不同：

- 参数表示函数能处理的输入：越广兼容性越好，能处理Animal则代表能处理Dog，但是能处理Greyhound不一定能处理Dog（说不定是husky= =）
- 返回值表示函数的输出：需要满足返回条件，返回Animal则不一定返回Dog

**参数的特殊性就是代表输入，而其他场景几乎都是输出**

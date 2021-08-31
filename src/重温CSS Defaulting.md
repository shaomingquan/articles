---
date: 2021-07-18
tags: css
---

> 惭愧，都21年了还在研究基础

所谓Defaulting，就是取默认值。对于html中的某个节点，某个css属性的最终值不仅取决于author提供的样式表，还会综合：

1. 属性的initial值
2. user-agent的样式表
3. 继承因素

最终计算的结果也就是我们在控制台中经常去查看的`Computed Values`。[Defaulting的详细过程](https://drafts.csswg.org/css-cascade-4/#defaulting)。

不过开发者可以通过Explicit Defaulting去改变Defaulting过程，顾名思义，也就是我们可以显式的指定Defaulting的策略。下面就是我们熟悉的几个css值，它们在每个属性里都可以使用：


1. initial 直接无视任何行为，直接打回属性的initial值
2. inherit 让一些无自动继承的属性也可以表现出继承，如margin-top
3. unset   尝试将属性的打回到initial value，但是保持默认的inherit行为
4. revert  尝试将属性的打回到user-agent value，但是保持默认的inherit行为

这里只讲对开发者提供样式表的影响，具体的可以去扣spec。在实践中还是写点demo帮助自己理解，或者随便打开一个console开始实验，比如吧：

- unset revert 对比 initial，它们会保持inherit，可以拿font-family试试 https://drafts.csswg.org/css2/#propdef-font-family （font-family经常性的在body被声明，会一直被继承下去）
- unset 对比 revert，revert会打回到user-agent，可以拿ul元素的padding-inline-start试试（padding-inline-start的initial值是0，但在chrome中user-agent的值是40px）

> 属性的initial值也会跟user-agent走，比如font-family，具体属性的具体情况查看各自spec即可
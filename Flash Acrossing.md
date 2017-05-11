在之前面试实习生岗位的时候被主管顺藤摸瓜问的一个问题。

> 主管：“你这个hover效果怎么写的？”
我：“%……#￥%……”
主管：“很好，如果我需要实现掠过不产生效果呢？”

这是个实实在在的场景：**掠过不意味着用户想hover**，此时触发hover效果只会降低用户体验。

我当时使用JS讲了这个问题的实现，使用JS必然涉及到定时器，这里管理好定时器即可。现在突然会想起这个问题，实际上css可以完美解决。

***stage 1***

只需要加个属性`transition-delay`，顾名思义。注意这里面不可用`display:none/block`来切换展示与否，规范详见 https://www.w3.org/TR/css3-transitions/#animation-of-property-types-
```css
ul {
  visibility: hidden;
  transition-property: visibility;
  transition-duration: 0s;
  transition-delay: 100ms;
}

div:hover + ul {
  visibility: visible;
}
```
***stage 2***

上面的例子有什么不好呢？当鼠标移开的时候的一点点延迟稍微让它显得不完美。所以delay属性放在伪类里面，这样好些。
```
ul {
  visibility: hidden;
  transition-property: visibility;
  transition-duration: 0s;
}

div:hover + ul {
  visibility: visible;
  transition-delay: 100ms;
}
```
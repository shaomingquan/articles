---
date: 2021-01-09
tags: javascript
---

> 很多时候很多人react代码就是瞎gr写，反模式多了性能就差了，现在大家都在谈优化，谈谈反模式或许也很有用

### update过程中触发remount

显然是违背本意了，常见的反模式：

- 滥用key
- 使用即时高阶组件

如下规则，如果违背，直接触发`unmount`和`mount`：

```js
function shouldUpdateReactComponent(prevElement, nextElement) {
  var prevEmpty = prevElement === null || prevElement === false;
  var nextEmpty = nextElement === null || nextElement === false;
  if (prevEmpty || nextEmpty) {
    return prevEmpty === nextEmpty;
  }

  var prevType = typeof prevElement;
  var nextType = typeof nextElement;
  if (prevType === 'string' || prevType === 'number') {
    return nextType === 'string' || nextType === 'number';
  } else {
    return (
      nextType === 'object' &&
      prevElement.type === nextElement.type &&
      prevElement.key === nextElement.key
    );
  }
}
```

当然这并不是什么极其可怕的是，只不过如果违背本意的更新是不需要的，比如在一个层级比较低的位置使用key重置组件以及组件state，对性能没啥影响（反而，官方是建议在特定的场景使用这个模式）。

还遇到过一次，疯狂抽象，然后不小心把一个高阶组件的生成逻辑写到了render里：

```js
import React, { useState, useCallback } from 'react';

function App() {
  const [ a, setA ] = useState(1)
  const addA = useCallback(() => setA(1 + a), [ a ])

  const TestFC = () => {
    const [ b, setB ] = useState(1)
    const addB = useCallback(() => setB(1 + b), [ b ])
    return <div>
        <button onClick={addB}>++b</button><span>{b}</span>
    </div>
  }
  
  const ele = <TestFC />
  console.log('TestFC ele: ', ele)

  return (
    <div>
        <button onClick={addA}>++a</button><span>{a}</span>
        {ele}
    </div>
  );
}

export default App;
```

1. 先点击两次`++b`按钮，b变为3
2. 再点`++a`按钮，b变回1

临时FC的type类型就是他自己，因为是个字面量，所以前后总是不同的，所以总是不满足`prevElement.type === nextElement.type`，总是remount。如果非要这样，那么就需要一个缓存以及清除缓存的机制了（可以用一个值selector的map做，map做缓存，selector做缓存值更新）

### update了本可复用的ReactElements

善用`SCU`，可直接复用`prevElement`，无需求`nextElement`

- props滥用字面量

字面量会破坏`SCU`（要是用deepEqual杠确实没辙）。从最开始的成员函数`bind this`来作为`handler`，到箭头函数成员函数来作为`handler`，再到`useCallback`，这些react写法帮助开发者避免了很多字面量。再就是注意lib是：

- 副作用的
- 还是immutable的

副作用的也不一定坏，immutable也得用到正地方。还有就是用缓存了，相同条件下衍生内存相同的字面量，条件变化再更新，就像reselect+redux，以及其他选型or case也是类似方式。

### update域过大

react以及dom就是一个大树，ui更新的过程就是更新这个树，更新要精准，范围过大就稍微浪费了，

- 全局更新
- 使用最近根，更新树的两个枝

用mobx是比较容易实现只更新两个枝的（用state和props这一套也能模拟这种分割update的情况）。总之不能全局update
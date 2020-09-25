---
date: 2019-08-05
tags: javascript
---

### 1，[Introducing Hooks](https://reactjs.org/docs/hooks-intro.html)

这篇文档中官方告诉我们为啥要有hooks 。

一些“suger”：
1. 不用写class 了。
2. 所谓更函数式。

一些痛点

**It’s hard to reuse stateful logic between components**

谈到 render props 和 higher-order components 的缺点，官方觉得这两种模式对原组件侵入性太大，模式太重，易形成“wrapper hell”。

hooks不用改变组件层级就可以做类似封装。

**Complex components become hard to understand**

官方吐槽最为致命。谈到`componentDidMount`，`componentDidUpdate`，`componentWillUnmount`，我们总是会把副作用代码放到这里，这些个生命周期混着用总是会把不关联的代码放在一起，但是相关的代码却总是分离。

> 上面三个生命周期函数大概都可以表达“渲染结束”，那么有关渲染结束的代码段就不得不抽取出来，如果在componentDidMount中同时操作两个不太相关的state，还是要各种抽。对于副作用的操作，hooks提供了更好的方法。

**Classes confuse both people and machines**

官方不推崇class语法了。

1. 觉得this的学习成本比较高，特别是那些非jser。
2. 会造成一些compilation优化的退化。比如影响压缩提及，hot-reload会有奇怪的问题。

所以用react hooks就可以不用class语法了。

### 2，[Hooks at a Glance](https://reactjs.org/docs/hooks-overview.html)

### 3，[Using the State Hook](https://reactjs.org/docs/hooks-state.html)

useState用起来比较简单以至于一个例子可解释的清楚。

```jsx
import React, { useState } from 'react';
 
function Example() {
    /*
    核心方法useState，它唯一参数就是state默认值
    它返回最新的状态值，直到下次渲染开始之前都是这个值
    以及用来修改这个状态的函数
    */
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>You clicked {count} times</p>
            {/* 这里在click回调的时候更新这个state */}
            <button onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    );
}
```

### 4，[Using the Effect Hook](https://reactjs.org/docs/hooks-effect.html)

如果需要perform一些副作用，要用到另外一种hook。useEffect。

```jsx
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // Similar to componentDidMount and componentDidUpdate:
  // useEffect接收一个函数，在每次渲染完之后执行一下，这里面通常放一些副作用（io啊，dom啊）
  useEffect(() => {
    // Update the document title using the browser API
    document.title = `You clicked ${count} times`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

通常来说，要搭配useState一起用，因为**useState获取的是最新的状态，直到下次rerender都不会改变的**，这里生成一个clourse，useEffect会在render借宿使用这个最新状态perform一些副作用。

cleanup，执行一些mirror方法，如下：

```jsx
import React, { useState, useEffect } from 'react';

function FriendStatus(props) {
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    // Specify how to clean up after this effect:
    return function cleanup() {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  });

  if (isOnline === null) {
    return 'Loading...';
  }
  return isOnline ? 'Online' : 'Offline';
}
```

useEffect返回的函数会在下一次执行这个effect的时候尝试调用，做一些cleanup的事情，通常是mirror方法。在willUNmount的时候也会执行。

使用一组useState和useEffect就可以实现一个可插拔的抽象，在未做抽象之前，也提倡使用这种方式将逻辑解耦（后续实习自己的hooks）。

***Why Effects Run on Each Update***

按照官方的说法原罪就是componentDidMount，componentDidUpdate，componentWillUnmount这几个方法不好用，容易遗忘一些逻辑，容易写出冗余代码，它们很形象，但是抽象的不好。我们就看[官方给的例子](https://reactjs.org/docs/hooks-effect.html#explanation-why-effects-run-on-each-update)就很清楚了。

***我想用原来的一些模式，怎么回退呀？***

我就想用类似componentDidMount和componentWillUnmount这样的怎么办？这时候就用到useEffect的第二个参数了，这个就很灵活了，一些states或者props会驱动这些effects的执行，把它们放到一个数组里，如果跟上次相比都没有变化，那么effect不执行，上一个effect的cleanup也不调用，所以上面说cleanup是“尝试调用”。

好像跟componentDidMount和componentWillUnmount没什么关系？把第二个参数设置为空数组，effect执行函数和返回值就相当于componentDidMount和componentWillUnmount生命周期，它们分别在初次渲染和UNmount执行。

***感想***

- useEffect简化了原先复杂的生命周期函数。
- 同时更关注副作用，副作用的cleanup，更容易指示副作用去re-perform。
- 这种模式把states和props同质化，没必要区分谁是谁，我只知道它变了就行（但一般来说副作用往往还是props驱动的）。

> 我开始喜欢上hooks了！

### 5，[Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)

> 使用hooks，我们需要遵循官方的一些游戏方法。

***Only Call Hooks at the Top Level***

最重要的是，hooks通过执行顺序去identify它是哪个state，或者effect，把它放在for循环和if里面，不会有语法错误，只是这样更容易出bug，流程语句会改变顺序以及个数。

***Only Call Hooks from React Functions***

我不知道在其他地方call这个能做什么。

**工具**

可以加一个[eslint](https://reactjs.org/docs/hooks-rules.html#eslint-plugin)。

### 6，[Building Your Own Hooks](https://reactjs.org/docs/hooks-custom.html)

抽出公共逻辑，hooks的代码段插拔特别容易。

```jsx
import React, { useState, useEffect } from 'react';

function FriendStatus(props) {

  // 可复用逻辑
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  });

  if (isOnline === null) {
    return 'Loading...';
  }
  return isOnline ? 'Online' : 'Offline';
}
```

```jsx
import React, { useState, useEffect } from 'react';

// 抽离
function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
    };
  });

  return isOnline;
}

// 可以在这用
function FriendStatus(props) {
  const isOnline = useFriendStatus(props.friend.id);

  if (isOnline === null) {
    return 'Loading...';
  }
  return isOnline ? 'Online' : 'Offline';
}

// 也可以在其他组件里直接使用
function FriendListItem(props) {
  const isOnline = useFriendStatus(props.friend.id);

  return (
    <li style={{ color: isOnline ? 'green' : 'black' }}>
      {props.friend.name}
    </li>
  );
}
```
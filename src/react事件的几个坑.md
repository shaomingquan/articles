记录react事件的几个坑

### 1，合成事件异步使用

这个比较normal了，如果异步使用合成事件要调用。合成事件的对象是会被复用的，每次同步事件调用完就把里面的`props`扔了。因为扔了，所以在异步事件中使用事件对象是取不到里面的值的。`e.persist()`就是把这个对象持久化，但是它不再复用。

```js
import React from 'react';

function App() {
  return (
    <div onClick={(e) => {
      console.log(e.nativeEvent, '1')
      // e.persist()
      setTimeout(() => {
        console.log(e.nativeEvent, '2')
      }, 100);
    }} className="App">
      APP
    </div>
  );
}
export default App;
```

### 2，createPortal事件冒泡

使用react事件结构需要脱离dom的结构，如果按dom结构去考虑下面例子，那么事件是不会冒泡到`.App`的，道理都懂，react合成事件是代理到document之后统一处理的，它只看react本身的结构。

```js
import React from 'react';
import ReactDOM from 'react-dom'

function App() {
  return (
    <div onClick={(e) => {
      console.log(e.target)
    }} className="App">
      {ReactDOM.createPortal(<button>按钮</button>, document.getElementById('root'))}
    </div>
  );
}

export default App;
```

### 3，ref上的原生事件慎用阻止冒泡

根据合成事件的特点，下面的`no event`将不会打印。

> 自杀性事件绑定

```js
import React from 'react';
import ReactDOM from 'react-dom'

function App() {
  return (
    <div onClick={(e) => {
      console.log(e.target)
    }} className="App">
      {ReactDOM.createPortal(<button onClick={e => {
        console.log('no event')
      }} ref={dom => {
        if (!dom)
          return
        dom.addEventListener('click', e => {
          e.stopPropagation()
        })
      }}>按钮</button>, document.getElementById('root'))}
    </div>
  );
}

export default App;
```
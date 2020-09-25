---
date: 2019-09-12
tags: javascript
---

> 接触react也有一段时间了，这次读了下react-tabs的代码，了解一些正统的设计理念。

它的主要文件放在`https://github.com/reactjs/react-tabs/tree/master/src/components`下面，有这样几个组件：

```
- Tab.js
- TabList.js
- TabPanel.js
- Tabs.js
- UncontrolledTabs.js // ??? 后面说
```

按照官方的使用方法，我们很容易区分哪个是哪个：

```js
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export default () => (
  <Tabs>
    <TabList>
      <Tab>Title 1</Tab>
      <Tab>Title 2</Tab>
    </TabList>

    <TabPanel>
      <h2>Any content 1</h2>
    </TabPanel>
    <TabPanel>
      <h2>Any content 2</h2>
    </TabPanel>
  </Tabs>
);
```

### 搭积木规则

准确的来说这是一个组件套装，通过搭积木的方式组合成一个完整的tab页功能，这些套件必须组合使用，但又保持单个组件的功能和语义的独立。`react-tabs`通过一个自定义类型去限定**积木的搭建方式**。

可以看下`https://github.com/reactjs/react-tabs/blob/master/src/helpers/propTypes.js`文件的`childrenPropType`方法，这个方法限定了积木搭建规则。直奔主题，看它的报错信息即可秒懂。

- Found multiple 'TabList' components inside 'Tabs'. Only one is allowed.
- Found a 'Tab' component outside of the 'TabList' component. 'Tab' components have to be inside the 'TabList' component.
- There should be an equal number of 'Tab' and 'TabPanel' in \`${componentName}\`. Received ${tabsCount} 'Tab' and ${panelsCount} 'TabPanel'.

### 受控模式切换层

先看`UncontrolledTabs.js`的代码，它是一个无状态的组件，实现了完整的`Tabs`功能，它的状态来自外部驱动（这里的文件命名我有点不懂，但是它的状态确实是外部驱动的）。这时候关注下`Tabs`组件，它引用了`UncontrolledTabs`，`UncontrolledTabs`则相当于内核。`Tabs.js`里面有这样一段代码：

```js
static getModeFromProps(props) {
    return props.selectedIndex === null ? MODE_UNCONTROLLED : MODE_CONTROLLED;
}
```

如果用户使用`Tabs`组件的时候传入`selectedIndex`则自动为**受控模式**这时候，这个层不存关于`selectedIndex`的状态，状态来自调用处。如果不传入`selectedIndex`则为**非受控模式**，则在中间层维护一个状态，且状态的初始值是`default`

```js
if (newState.mode === MODE_UNCONTROLLED) {
    const maxTabIndex = getTabsCount(props.children) - 1;
    let selectedIndex = null;

    if (state.selectedIndex != null) {
        selectedIndex = Math.min(state.selectedIndex, maxTabIndex);
    } else {
        selectedIndex = props.defaultIndex || 0;
    }
    newState.selectedIndex = selectedIndex;
}
```

在`MODE_UNCONTROLLED`有几处关键处理，文件内搜索一下，以及在render里面也有一个`if`可以体现这个中间层的意义。

这个设计模式不错，配合[react官方的建议](https://reactjs.org/docs/uncontrolled-components.html)，可以形成一个最终的指导建议：**编写新的react组件时总是应该先实现受控模式。极少数情况下，通过中间层实现受控非受控的切换。**


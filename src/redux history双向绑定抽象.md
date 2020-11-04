---
date: 2019-10-29
tags: javascript
---

一个常见的场景，对于一个可以进行filter查询的list，希望用户可以随时通过复制链接的方式分享目前的筛选条件以及页数。解决方案就是实现store和history的双向绑定，这里的store是redux。对于这个场景的解决方案，实际上还可以推广到两个独立的sub/pub模型的互相绑定。关键点：

- 双向监听
    - 监听store
    - 监听history
- 序列化与反序列化
    - store序列化到search
    - search反序列化到store
- 上锁
    - 对于循环监听上锁
    - 对于无关action上锁
- 健康退出
    - 与组件声明周期联动
    - 交还关心参数值

### 双向监听

没什么好说的，这个很基础，最多查查api就好了

```js
const { subscribe } = store;
/// ...
const unsubStore = subscribe(handlerStore);
```

```js
import { globalHistory } from '@reach/router';
/// ...
const unsubHistory = globalHistory.listen(handleHistory);
```

### 序列化与反序列化

**think history as a store**，在store的selector中，实现一个可以把store内成员转化为可序列化object的selector，按照`ParsedUrlQueryInput`的类型就行，以及反序列化就是把`ParsedUrlQuery`转到store的成员

```ts
interface ParsedUrlQuery { [key: string]: string | string[]; }

interface ParsedUrlQueryInput {
    [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined | null;
}

function stringify(obj?: ParsedUrlQueryInput, sep?: string, eq?: string, options?: StringifyOptions): string;
function parse(str: string, sep?: string, eq?: string, options?: ParseOptions): ParsedUrlQuery;
```

### 加锁

- 当history改变`handleHistory`触发，会同步store，以触发`handlerStore`
- 再加上`handlerStore`触发时，会同步history，这样形成了一个循环

需要加一个锁来避免循环（其实可能不需要锁，但是加上比较健壮）

```ts
const handlerStore = () => {
    try {
        if (lockStoreListening) {
            return;
        }
        lockHistoryListening = true;
        //....
        lockHistoryListening = false;

const handleHistory: HistoryListener = ({ action, location: l }) => {
    try {
        console.log('action', action)
        if (lockHistoryListening) {
            return;
        }
        lockStoreListening = true;
        // ....
        lockStoreListening = false;
```

只监听需要的属性，对于无关的store，不做history同步，因为redux是单store的，所以各种action这个subscribe都会收到。这里的解决方案是确定一个**当前业务需要关系的序列化参数列表**，比如当前业务只需要`page, name, gender`这几个query字段，所以这里**不用弄action白名单，只需要关注，这几个字段的变化**，只有变了才会被处理：

```ts
const handlerStore = () => {
    try {
        if (lockStoreListening) {
            return;
        }
        lockHistoryListening = true;
        const queryFromStore = selectQueryByStore(getState());
        const queryFromLocation = getQueryFromLocationSearch(
            globalHistory.location,
        );
        // 当前store序列化结果是否与location的序列化结果相同
        if (
            _.isEqual(
                // 注意只筛选cared params
                selectCaredParamsFromQuery(queryFromStore), 
                selectCaredParamsFromQuery(queryFromLocation)
            )
        ) {
            return;
        }
        // 在selectQueryByStore定义store对于query的影响，如果发生不同步，再处理
```

所以其实有第二个锁，第一个锁其实不加也可。

### 健康退出

现在比较流行的模式，绑定之后返回一个解绑方法（这样的好处是对匿名函数更友好，但在这里不重要）

```ts
export const historyStoreBidirectBind = (options) => {
    // ....
    const unsubHistory = globalHistory.listen(handleHistory);
    // ....
    const unsubStore = subscribe(handlerStore);
    // ....
    return () => {
        unsubHistory();
        unsubStore();
    };
}
```

使用时，在组件里：

- mount调用bind
- unmount解除bind

```ts
// 当前业务的绑定
function demoListenBindHistory () {
    const options = { ... }
    // 调用双向绑定封装
    return historyStoreBidirectBind(options)
}

// 组件中引用
useLayoutEffect(() => {
    return demoListenBindHistory();
}, []);
```

交还关心参数值，这个其实我没有加，因为当前业务关系的参数可能在其他业务也在用，在进入当前业务时应保留原值，退出当前业务的时候应该替换回去，其实比较细节了，可以按需再加。

细节就不贴了，整体不算难，思路要点get到了就问题不大。当然如果有更好的姿势可以告诉我。
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
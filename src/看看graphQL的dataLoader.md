---
date: 2020-11-05
tags: javascript
---

> 挖挖graphQL里的dataLoader

最近在用graphQL，这玩意很爽，不过存在一些潜在的性能问题，经典的就是1+N问题，每次都要跟N各迭代的话，通信次数明显增多，但是每个resolver又是分别执行的，dataLoader就是解决了分别执行的resolver的合并执行问题。

首先微服务端要有一个mGet的实现，然后就可以这样定义一个loader。

```ts
const booksLoader = new DataLoader<string, any>(
    keys => global.d().book.mGetBooksByAuthorIds(keys), 
    { cache: false },
)
```

`mGetBooksByAuthorIds`返回一个Promise，resolve一个数组，代表每个key的结果。在resolver里：

```ts
async resolve(parent, { limit }/*  */) {
    const books = await booksLoader.load(parent.id)
    return books.slice(0, (limit === undefined || limit === null) ? Infinity : limit)
},
```

这是如果同时有两个resolve要执行，只会执行一次`mGetBooksByAuthorIds`，这就是dataLoader最简单的使用方法，现在挖一挖原理：

**load返回一个promise，但肯定不是立马resolve，resolve一定是在`global.d().book.mGetBooksByAuthorIds(keys)`resolve之后，在源码里它叫做`_batchLoadFn`，这个先有个sense就行，先看看load干嘛了：

```ts
  // 去掉类型检查cache等逻辑
  load(key: K): Promise<V> {

    var batch = getCurrentBatch(this);
    // batch的数据结构
    // var newBatch = { hasDispatched: false, keys: [], callbacks: [] };

    batch.keys.push(key);
    var promise = new Promise((resolve, reject) => {
      batch.callbacks.push({ resolve, reject });
    });

    return promise;
  }
```

其实就是拿到当前batch，再把resolve权移交给batch，这里需要关注的就是batch的声明周期，因为js是单线程的，所以同一时间每一次load只归属于一个batch。看看`getCurrentBatch`：

```ts
function getCurrentBatch<K, V>(loader: DataLoader<K, V, any>): Batch<K, V> {
  var existingBatch = loader._batch;
//  同样先干掉缓存逻辑
  if (
    existingBatch !== null &&
    !existingBatch.hasDispatched &&
    existingBatch.keys.length < loader._maxBatchSize
  ) {
    return existingBatch;
  }

  // Otherwise, create a new batch for this loader.
  var newBatch = { hasDispatched: false, keys: [], callbacks: [] };

  // Store it on the loader so it may be reused.
  loader._batch = newBatch;

  // Then schedule a task to dispatch this batch of requests.
  loader._batchScheduleFn(() => {
    //   这里就不用细看了，其实就是把callbacks中的resolve给执行了，那么load返回的promise就都resolve了
    dispatchBatch(loader, newBatch);
  });

  return newBatch;
}
```

每次尝试获取batch，如果：

- 没有batch
- batch已经被dispatch了
- 超量了

则生成一个新的batch，然后立即开始schedule，关键是啥？`_batchScheduleFn`：

```ts
// 在constructor里
this._batchScheduleFn = getValidBatchScheduleFn(options);

// 那就是这个了
// Private
function getValidBatchScheduleFn(
  options: ?Options<any, any, any>
): (() => void) => void {
  var batchScheduleFn = options && options.batchScheduleFn;
  if (batchScheduleFn === undefined) {
    //   默认的
    return enqueuePostPromiseJob;
  }
  if (typeof batchScheduleFn !== 'function') {
    throw new TypeError(
      `batchScheduleFn must be a function: ${(batchScheduleFn: any)}`
    );
  }
//   自定义的
  return batchScheduleFn;
}
```

默认的是啥？有啥用啥：

```ts
var enqueuePostPromiseJob =
  typeof process === 'object' && typeof process.nextTick === 'function' ?
    function (fn) {
      if (!resolvedPromise) {
        resolvedPromise = Promise.resolve();
      }
      resolvedPromise.then(() => {
        process.nextTick(fn);
      });
    } :
    setImmediate || setTimeout;
```

也可以自定义，直接看官方的例子吧：

```ts
// As an example, 
// here is a batch scheduler which collects all requests over a 100ms window of time
// (and as a consequence, adds 100ms of latency):

const myLoader = new DataLoader(myBatchFn, {
  batchScheduleFn: callback => setTimeout(callback, 100)
})

```

应该注意什么？每个resolve中，**load操作应该写在前面，让几个同步执行的resolver，它们的load操作可以在同一个事件循环中，它们才会在一起被调度，mGet才有意义**，比如下面的就是bad case：

```ts
async resolve(parent, { limit }, { user }) {
    // load前加了一个不定时的异步操作，多个load分别被多个batch调度，mGet不生效
    await delay(100 + Math.floor(Math.random() * 1000)) 
    const books = await booksLoader.load(parent.id)
    return books.slice(0, (limit === undefined || limit === null) ? Infinity : limit)
},
```
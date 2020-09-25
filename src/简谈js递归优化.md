---
date: 2017-02-02
tags: javascript
---

> 观点不完善，需要从运行时内存的角度在分析。

***从优化一个斐波那契数列开始***

好像听起来有点无聊。大概一个软件工程专业的学生在前五堂课中一定会接触到的东西。通常也是从斐波那契中认识到了递归。我们通常很容易就用递归写出一个结果。

```js
function fb_recurrence (n) {
    if(n <= 2) {
        return 1;
    }
    return fb_recurrence(n - 1) + fb_recurrence(n - 2);
}
```

runs well。但递归的方法通常因为调用栈产生性能问题，至少现在是这样的。现在有几个个优化方向。

- 递归改线性：一般来说，这是最难的做法，但是在本例中，还ok。
- 改尾递归写法：略动脑筋。
- 闭包缓存：对于无需优化到极致的业务来说有一定的提升幅度，但一定不极致。
- 尾递归优化：不支持尾递归？做一个假的尾递归来优化吧。

下面做一系列的测试，统一n值为10。

### 单一因素优化

***递归改线性***

```js
function fb_linear (n) {
    var current = 0, next = 1, swap;
    for(var i = 0 ; i < n ; i ++) {
        swap = current, current = next;
        next = swap + next;
    }
    return current;
}

```

结果：线性，快了两倍。

```
fb_recurrence x 2,022,434 ops/sec ±1.60% (84 runs sampled)
fb_linear x 43,057,887 ops/sec ±1.89% (82 runs sampled)
Fastest is fb_linear
```

***改尾递归写法***

我试了一下，确实有提升。

```js
function fb_recurrence_tail (n) {
    return fb(n, 0, 1)
    function fb(n, current, next) {
        if(n === 0) return current;
        return fb(n - 1, next, current + next);
    }
}
```

结果。

```
fb_recurrence x 1,946,436 ops/sec ±2.72% (79 runs sampled)
fb_recurrence_tail x 3,775,287 ops/sec ±2.77% (77 runs sampled)
Fastest is fb_recurrence_tail
```

***闭包缓存***

不要在意我如何描述这个，反正如下。套一层缓存。

```js
function cache (fn) {
    var cache = {};
    return function _ (n) {
        if(cache[n] !== undefined) {
            return cache[n];
        }
        var value = fn(n);
        cache[n] = value;
        return value;
    }
}

var fb_recurrence_cache = cache(function (n) {
    if(n <= 2) {
        return 1;
    }
    return fb_recurrence_cache(n - 1) + fb_recurrence_cache(n - 2);
})
```

提升幅度让我惊讶。

```
fb_recurrence x 1,981,895 ops/sec ±1.85% (83 runs sampled)
fb_recurrence_cache x 47,002,201 ops/sec ±1.89% (81 runs sampled)
Fastest is fb_recurrence_cache
```

***尾递归优化***

是从阮一峰老师的书了解到的。

注意，老师书中的方法是针对已经使用尾递归写法的递归来优化的。这里不重点解释。

```js
function trampoline(f) {
  while (f && f instanceof Function) {
    f = f();
  }
  return f;
}
function fb_recurrence_tail_optz1 (n) {
    return trampoline(fb(n, 0, 1))
    function fb(n, current, next) {
        if(n === 0) return current;
        return fb(n - 1, next, current + next);
    }
}

function tco(f) {
  var value;
  var active = false;
  var accumulated = [];

  return function accumulator() {
    accumulated.push(arguments);
    if (!active) {
      active = true;
      while (accumulated.length) {
        value = f.apply(this, accumulated.shift());
      }
      active = false;
      return value;
    }
  };
}
function fb_recurrence_tail_optz2 (n) {
    var fb = tco(function (n, current, next) {
        if(n === 0) return current;
        return fb(n - 1, next, current + next);
    });
    return fb(n, 0, 1);
};
```

结果，两种方法大概都没什么效果。

```
fb_recurrence_tail x 5,617,833 ops/sec ±2.76% (75 runs sampled)
fb_recurrence_tail_optz1 x 5,016,591 ops/sec ±3.90% (70 runs sampled)
fb_recurrence_tail_optz2 x 291,283 ops/sec ±3.99% (68 runs sampled)
Fastest is fb_recurrence_tail
```

### 一起跑一下benchmark


```
fb_recurrence（x x 1,402,255 ops/sec ±4.25% (64 runs sampled)
fb_linear x 26,183,207 ops/sec ±3.14% (63 runs sampled)
fb_recurrence_cache x 34,492,656 ops/sec ±5.71% (69 runs sampled)
fb_recurrence_tail x 5,600,370 ops/sec ±2.88% (75 runs sampled)
fb_recurrence_tail_optz1 x 2,934,147 ops/sec ±4.49% (67 runs sampled)
fb_recurrence_tail_optz2 x 318,679 ops/sec ±3.89% (72 runs sampled)
Fastest is fb_recurrence_cache
```

也就是说我们通常加一个cache闭包即可获得不错的效果，所以编写纯函数是多么重要，这意味着低成本的优化。不过本例仅供参考，具体情况请具体分析。
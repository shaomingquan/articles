花式curry。

第一种，传统的收集参数。

第二种，使用`Function.prototype.bind`来收集参数。

第三种，使用`generator`的惰性求值。

```js
function curry (func) {
    var args = [];
    return function _ (..._args) {
        if(arguments.length === 0) {
            return func.apply(null, args);
        } else {
            args = [...args, ..._args];
            return _;
        }
    }
}

function curry2 (func) {
    return function _ (...args) {
        if(args.length === 0) {
            return func.call();
        } else {
            func = func.bind(null, ...args);
            return _;
        }
    }
}

function curry3 (func) {
    var args = [];
    function* _ () {
        var arg;
        while(arg = yield) {
            args.push(arg);
        }
        return func.apply(null, args);
    }
    var gene = _();
    gene.next();
    return gene;
} 

```

要curry的函数：

```js
function sum (...args) {
    return args.reduce(function (ret, current) {
        return ret + current;
    }, 0)
}
```

前两种运行方法：

```js
var _sum = curry2(sum);
_sum(1)(2)(3)(); // 6
```

最后一种运行方法。

```js
var _sum = curry3(sum);
_sum.next(1);
_sum.next(2);
_sum.next(3);
_sum.next(); // Object {value: 6, done: true}
```
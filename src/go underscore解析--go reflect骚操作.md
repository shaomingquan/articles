> golang作为静态语言，对于常用动态语言的程序员来说，可能会觉得很束缚，在golang中，一个在javascript非常常见的FOP语句，在golang中却无法有很通用的抽象。然而并不是完全没有办法，在golang中，增强动态性的手段有四种。（1）接口+类型断言。（2）反射。（3）unsafe.Pointer。（4）代码生成。本文着重解析`github.com/tobyhede/go-underscore`，来感受反射带来的动态性。

## golang难受的地方

***如果想实现一个对很多类型通用的函数，或者在js中十分简单，如果在一个有泛型体系的语言里也不难***

如在typescript里面，我们可以这么写：

```typescript
function filter<T>(arr: T[], checker: (item: T, index: number) => boolean): T[] {
    const ret = []
    arr.forEach((item, index) => {
        if (checker(item, index)) {
            ret.push(item)
        }
    })
    return ret
}

filter<number>([1, 2, 3, 4, 5], (item, index) => {
    return true
})
```

[golang通用函数抽象](https://golang.org/pkg/reflect/#example_MakeFunc)
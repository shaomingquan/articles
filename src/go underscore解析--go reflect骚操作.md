> golang作为静态语言，对于常用动态语言的程序员来说，可能会觉得很束缚，在golang中，一个在javascript非常常见的FOP语句，在golang中却无法有很通用的抽象。然而并不是完全没有办法，在golang中，增强动态性的手段有四种。（1）接口+类型断言。（2）反射。（3）unsafe.Pointer。（4）代码生成。

> 我不会讲reflect和interface的底层，本文着重解析`github.com/tobyhede/go-underscore`的原理，来感受反射带来的动态性。

## golang难受的地方

***如果想实现一个对多类型通用的函数，或者在js中十分简单，如果在一个有泛型体系的语言里也不难***

如在typescript里面，我们可以这么写：

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

在golang中如何实现呢？如果学习过interface大概很快就有大体的思路：

```golang
func filter(arr []interface{}, filter func(item interface{}) bool) []interface{} {
	ret := []interface{}{}
	for _, item := range arr {
		if filter(item) {
			ret = append(ret, item)
		}
	}
	return ret
}
```

看起来不错，但是难受在`[]inteface{}`不能接收`[]int`类型作为输入，根源在于golang没有支持泛型，`interface{}`也不能完全替代泛型的功能。所以我们要将slice“泛化”：

```golang
func main() {
	list := []int{1, 2, 3, 4, 5}
	// interface{}化（也就是所谓泛化吧）
	ilist := []interface{}{}
	for _, item := range list {
		ilist = append(ilist, interface{}(item))
	}

	ret := filter(ilist, filterFn) // 获得结果（[]interface{}类型）
}
```

而且返回值是`[]interface{}`类型的，想要直接用，还要做转换。载来看看`filterFn`的实现，也很难受了：

```go
func filterFn(item interface{}) bool {
	switch item.(type) {
	case int:
		return item.(int) > 3
	}
	return false
}
```

## 加些反射吧

与其像上面那么写，还不如不做这个抽象了。先把代码贴出来。

```go
package main

import (
	"fmt"
	"reflect"
)

// 提供签名，不提供实现
var everyInt func([]int, func(int, int) bool) bool
var everyFloat func([]float32, func(float32, int) bool) bool

func init() {
	maker(&everyInt, every)
	maker(&everyFloat, every)
}

func main() {
	ret1 := everyInt([]int{1, 2, 3, 4}, func(n int, i int) bool {
		return n > 3
	})
	ret2 := everyFloat([]float32{1.0, 2.0, 3.0, 4.0}, func(n float32, i int) bool {
		return n > 0.0
	})
	fmt.Println(ret1) // false
	fmt.Println(ret2) // true
}

func maker(fn interface{}, impl func(args []reflect.Value) (results []reflect.Value)) {
	fnV := reflect.ValueOf(fn).Elem() // get the value interface contains
	fnI := reflect.MakeFunc(fnV.Type(), impl)
	/*
		MakeFunc解释及用法：https://golang.org/src/reflect/makefunc.go
		fnI是签名为fn, 内核为impl的函数，替换原本的无实现函数。
	*/
	fnV.Set(fnI)
}

// 提供实现，不提供签名
func every(values []reflect.Value) []reflect.Value {
	// 所有的函数签名必须第一个参数时slice，第二个参数时callback
	arr := values[0]
	fn := values[1]

	ret := true

	// 遍历slice
	for i := 0; i < arr.Len(); i++ {
		v := arr.Index(i)
		// 调用
		if ok := callPredicate(fn, v, reflect.ValueOf(i)); !ok {
            ret = false
            break
		}
	}

	return []reflect.Value{reflect.ValueOf(ret)}
}

func callPredicate(fn reflect.Value, args ...reflect.Value) bool {
	in := fn.Type().NumIn()
	res := fn.Call(args[0:in])
	return res[0].Bool()
}
```

重点是MakeFunc的使用和理解（[参考官方例子](https://golang.org/pkg/reflect/#example_MakeFunc)）。

我的理解是，***MakeFunc实现了吧反射功能的内核挂载到函数变量中***，内核签名非常通用：

```go
func (values []reflect.Value) []reflect.Value
```

可以与任何func签名映射。基于某种约定实现一个类型内核签名的方法，可以挂载到一系列签名符合约定不同的函数变量中。从而实现快读拓展。

### 后续

后续准备看看反射的性能。
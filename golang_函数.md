***func***

golang的函数和方法的实现都依赖func关键字。最简单的，可以定义一个没有输入输出的func。

```go
func a () {
  fmt.Println("hello world")
}
```

***参数列表，返回列表***

golang支持多返回值，因此有返回列表的概念，多返回值类似js中的结构赋值。`func a (参数列表) 返回列表 { 函数体 }`，如下：

```go
func b (a, b int, c string) (string, int) {
  return c, a + b;
}
// 调用
func a () {
  x, y := b(1,2, "hello world")
  fmt.Println(x, y)
}
```


***函数也是类型***

实现闭包需要返回一个方法，那么在强类型的golang中，需要将函数描述为类型，这并不像js中那么轻松。

```go
func b (a, b int, c string) (string, int) {
  return c, a + b;
}

func c () (func (a, b int, c string) (string, int), string) {
  return func (a, b int, c string) (string, int) {
    return c , a + b
  }, "hello"
}
```

b对应的函数类型为b对应的匿名函数的类型。函数作为类型与string，int等基本类型别无二致。


***形参实参***

在golang中，形参一律是实参的拷贝，这点在golang函数调用中很重要的特性。这意味着无副作用的函数实现成本为零（因为都是deepCopy），实现由副作用的函数则需要传入指针类型。这点与js中的基本类型复制，对象类型引用不同。

无副作用：
```go
func dd (a int) {
  a ++
}
```
副作用：
```go
func d (a *int) {
  *a ++
}
```
则下面输出为3：
```go
func a () {
  q := 2
  d(&q)
  dd(q)
  fmt.Println(q)
}
```

副作用不是意味着不存在拷贝，指针同样被生成了两份，只是取地址的值是同一份。

不仅是参数会产生深拷贝，返回值也会产生深拷贝。

```go
copyyy := func (slice *[]int) []int { // return also copy the value
  return *slice
}
```
上面的返回值与传入值的地址是不同的。至于传参数和返回值，本质上还是赋值，所以其实golang的赋值也完全是拷贝。

```go
type Test struct { name string }
testA := Test{"xiaoming"}
testB := testA
fmt.Println(&testA == &testB) // false
```

在js中，用户喜欢使用 === 操作符去比较两个变量是否引用到一个内存。在golang中没有 === 操作符，实际上在其他语言中 == 属于语法糖，包含隐式转化（隐式类型转换发生在接口以及指针类型调用方法时），在golang中，== 相当于其他语言的 ===。按js的套路，下面第一个应该返回false。

```go
structA := struct {
  name string
}{"xiaoming"}

// type struct{string} !== struct{name string}
copyStruct := func (s struct{name string}) struct{name string} {
  return s
}
structB := copyStruct(structA)
fmt.Println(structA == structB) // true
fmt.Println(&structA == &structB) // false
```

golang中的 == 只是值判断，跟js完全不同。


***添加方法***

这里涉及到type的使用。首先golang不允许给原始类型定义方法，如果想实现一个给int型加2的方法，需要这样：

```go
type Iint int
func (base Iint) add2 () int {
  return int(base) + 2
}
```

- 用type关键字给一个可以表达变量类型命名alias，但是Iint与int不是同一类型，但可以互相显示转化。（一般还会给定义结构体定义type）。
- 在func和函数名之间声明将要添加方法的type，与其在函数体实现中的代理变量（在js，java中的this），golang中不会出现this，this甚至可以被声明成一个变量。this避讳了类似js的动态作用域的特性，这有时很让人头疼。


然后就可以这样使用：

```go
func a () {
  ii := Iint(3)
  iii := ii.add2()
  fmt.Println(iii)
}
```

也可以这样玩。

```go
var count = 0
type FuncEmpty func ()
func (f FuncEmpty) add () FuncEmpty {
  fmt.Println(count);
  count ++
  return f
}
```

```go
f := FuncEmpty(func () {})
f.add().add().add()
```

但不可以这样玩

```go
type FFF func (i int) int
fff := FFF {
  return 1
}
```

单靠函数的方法功能还无法担任oop编程，还需要有结构体的帮助。

***特殊函数***

- main，程序入口，只有函数main函数才会被构建出可执行文件，若构建目标没有main函数，则只执行语法检测。

- init，包引入（初始化）时执行。作用是做一些准备工作，golang不允许在函数外执行调用，函数外只会声明一些包的全局变量。

- 大写开头的任意函数， 会被导出的函数。
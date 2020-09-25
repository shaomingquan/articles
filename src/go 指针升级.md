---
date: 2018-08-08
tags: golang
---

### pointer: go vs c

go提供了指针，但是go对指针做了很多的限制。日常工作中，基本上就是把指针当成js中的引用来用，避免大块内存被复制。跟传统意义上的指针（c的指针）相比，go的指针主要有以下限制：

##### 限制1，在c语言中，我们是可以操作指针的，如下程序，把指针向右移动，遍历整个数组。

c指针移动

```c
#include "stdio.h" 
#include "stdlib.h" 
   
int main() 
{ 
    int index = 0; 
    int number[3] = {1, 2, 3};
    int *p = &number[0];
    printf("p的值是 %x\n", p);
   
    printf("本机int类型占用 %d 个字节\n", sizeof(int));
   
    for(index = 0; index < 3; index++) 
    { 
        printf("第 %d 个元素的地址是 %x\n", index + 1, &number[index]); 
    }
   
    for(index = 0; index < 3; index++) 
    { 
        printf("p加 %d 的值是 %x\n", index, p + index); 
    }
       
    return 0; 
}
```

##### 限制2，在c中，指针是可以做类型转换的，实际上可以理解为以不同的角度去看内存。go的指针不行。

### unsafe.Pointer： 类型转换

在默认情况下，我们所用到的所有go的指针可以被叫做safePointer。大部分情景下，使用go的指针机制让内存更加安全了，但在某些情景下，这限制了go的性能。所以go官方提供了unsafe.Pointer这个工具去做细粒度的内存操作。如下定义：

`type Pointer *ArbitraryType`
先看语义，从语义上，我们猜想`unsafe.Pointer`可以做任何类型的转换，所以以`unsafe.Pointer`作为桥接，可以实现两个不同类型指针的类型转换。如下：

```go
// Float64bits returns the IEEE 754 binary representation of f.
func Float64bits(f float64) uint64 { return *(*uint64)(unsafe.Pointer(&f)) }
```

通过unsafe.Pointer，把float64转成uint64，如果使用直接做类型转换，无论如何也要申请新的内存。使用unsafe可以实现指针类型转换而不申请内存（当然，不能把值取出来在比较），看下面示例：


```go
package main
 
import (
    "fmt"
    "unsafe"
)
 
type myInt int
 
func main() {
    var a myInt = 1
    b := int(a)
    fmt.Printf("%v, %v", &a, &b) // 不相等
    fmt.Println()
 
    c := (*int)(unsafe.Pointer(&a))
    fmt.Printf("%v, %v", &a, c) // 相等
}
```

这也就完成了对限制2的突破。

### uintptr： 指针移动

uintptr就是表示一段内存的uint，本质上还是int，可以做加减法也就是移动。如下示例：

```go
package main
 
 
import (
    "fmt"
    "unsafe"
)
 
func main() {
    b := [3]int{1, 2, 3}
    size := unsafe.Sizeof(b[0])
    pb := uintptr(unsafe.Pointer(&b))
 
    nextv := *(*int)(unsafe.Pointer(pb + size))
    fmt.Println(nextv)
 
    *(*int)(unsafe.Pointer(pb + size)) = 4
    fmt.Printf("%v\n", b)
}
```

上面示例中，我们可以获取元素2的地址，取值&重写。

unsafe主要有两个api提供信息以支持指针移动：

```go
func Offsetof(selector ArbitraryType) uintptr
func Sizeof(variable ArbitraryType) uintptr
```

Offsetof用来获得某个字段在结构体中的偏移量，Sizeof用来获取类型在当前操作系统中的大小。

### 应用

1，去反射的一种思路

https://zhuanlan.zhihu.com/p/25474088

当然用代码生成也可以做到去反射。如：https://github.com/go-reform/reform（没有在生产环境用过这个）

2，内存不变的类型转换

### tips

1，类型转换原则：

在上面的例子中unsafe.Pointer与指针和uintptr都进行了类型转换，原则是unsafe.Pointer可以转换为任何指针或uintptr，反之亦然，任何指针或uintptr都能转换成unsafe.Pointer。

2，类型*unsafe.Pointer是一个safaPointer。
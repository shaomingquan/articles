***真正的并发***

与js的事件队列不同的是，golang从语言层真正实现了并发。go在语言层实现了协程，这比java的线程轻量很多。使用go协程的方法很简单，如下。

```go
func main () {
	go func () {
		fmt.Println("world")
	}()
	fmt.Println("hello")
	start := time.Now()
	for {
		if time.Now().Sub(start) > time.Second * 1 {
			break
		}
	}
}
```

使用go表达式加一个函数调用即可启动一个go协程，main函数本身是一个go协程。在js中，如果使用setTimeout(func, 0)去替代上面的go，那么在后面阻塞线程时会推迟timer调用（js的单线程基础测试题），实际上js中的nextTick更像是golang中的[defer](https://gobyexample.com/defer)。

***go协程安全***

如果涉及到并发写操作，需要程序保证写入安全。两个思路：

- unbuffered channal。
- 加锁。


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

使用go表达式加一个函数调用即可启动一个go协程，main函数本身是一个go协程。在js中，如果使用setTimeout(func, 0)去替代上面的go，那么在后面阻塞线程时会推迟timer调用（js的单线程基础测试题，线程阻塞会阻塞io handler执行），实际上js中的nextTick更像是golang中的[defer](https://gobyexample.com/defer)。

***协程通信***

往往只是并发是不够的，还需要同步。最简单的，需要主协程同步子协程的执行结果，这里用到golang的管道（channel）

```go
var ch chan int = make(chan int)
func main () {
	i := 0
	j := 0
	go func () {
		time.Sleep(time.Second)
		i ++
		ch <- i // 同步消息，主协程收到消息，阻塞取消。
	}()
	go func () {
		time.Sleep(time.Second)
		i ++
		ch <- j
	}()
	i = <- ch // 等待其他协程同步消息，阻塞中。
    print(i)
	j = <- ch
    print(j)
}
```

这样原来同步的两件事就可以先并发，然后再把结果同步到主协程。

这时候如果再追加一个接收`j = <- ch`，会报一个程序死锁的错误`fatal error: all goroutines are asleep - deadlock!`，此时资源将无法被释放，主线程主动退出。至少让主线程的状态保持在保活或者退出的状态，就不会发生死锁。如下：

```go
go func () {
    i = <- ch
    print(i)
    j = <- ch
    print(j)
    j = <- ch
}()
time.Sleep(time.Second * 5)
```

***go协程泄露***

书写go协程的时候，避免死锁错误并不是底线，这里引出go协程泄露。

```go
func goroutineLeak () {
	ch := make(chan int)
	go func () {
		ch <- 0
		ch <- 1
	} ()
	go func () {
		<- ch
		<- ch
		<- ch
	} ()
}
```

循环上面代码会造成内存泄露，原因是第二个协程将会永远的block，资源无法释放。go协程泄露跟管道没什么必然的关系，只是使用管道容易写出类似的问题。如下也会协程泄露。

```go
func goroutineLeak2 () {
	go func () {
		time.Sleep(time.Second * 10000000)
	} ()
}
```

在原生的js中，形成闭包的函数在父作用域生命周期结束之后再内存中保留，go协程完全不同，从现象到机制，go协程只需区分主协程与其他协程，主协程回收时会回收其他协程，其他协程的回收并不会回收其创建的go协程，像下面的写法，外层的go协程虽然执行完毕，但是仍然会泄露。

```go
for {
    time.Sleep(1 * time.Microsecond)
    go func() {
    	goroutineLeak2()
    }()
}
```

go协程之间没有父子关系。


接收和发送是一对一的，如果存在多余的发送，则需要等待下一次接收的执行。

***读写不同步***

在协程通信中提到接受阻塞的问题，这里需要再提及一点，如果接收端缺少，发送端也会阻塞，在实际场景中，由于种种因素，发送端和接收端两边的逻辑很有可能是延时的。如下：

```go
var ch chan int = make(chan int)
go func () {
	for i := 0 ; i < 10 ; i ++ {
		go func (i int) {
			ch <- i
			print(i)
		} (i)
	}
} ()
go func () {
	for i := 0 ; i < 10 ; i ++ {
		<- ch
		time.Sleep(time.Second)
	}
} ()
time.Sleep(time.Second * 11)
```

上面程序的运行效果是每隔1s打印一次，不保证顺序。上回的泄露说道，如果有阻塞则有泄露的风险，如果发送端的数据由go协程并发生产，那么当消费速度过慢时，会有大量阻塞的go协程，需要引入一个机制去监控读写不同步的情况，极度不同步则丢弃数据，避免产生过多go协程而内存溢出。如下，假设接收方处理时间较长，发送方不断发送。

```go
var ch chan int = make(chan int)
go func () {
	for i := 0 ; i < 1000000000 ; i ++ {
		time.Sleep(time.Second / 1000)
		go func (i int) {
			ch <- i
		} (i)
	}
} ()
go func () {
	for i := 0 ; i < 100000 ; i ++ {
		<- ch
		time.Sleep(time.Second / 100)
	}
} ()

```

可观测到内存快速增长。这里引入带缓冲区的管道。压力会缓解一些？

```go
var ch chan int = make(chan int)
```

如下更好的解决问题：

- 使用带缓冲区的管道让写入可以执行，以释放go协程。
- 通过拒绝服务减少系统压力。

```go
var ch chan int = make(chan int, 100000)
go func () {
	for i := 0 ; i < 1000000000 ; i ++ {
		time.Sleep(time.Second / 1000)
		if(len(ch) == cap(ch)) {
			continue
		}
		go func (i int) {
			ch <- i
		} (i)
	}
} ()
go func () {
	for i := 0 ; i < 100000 ; i ++ {
		<- ch
		time.Sleep(time.Second / 100)
	}
} ()
```


***go协程安全***

如果涉及到并发写操作，需要程序保证写入安全。两个思路：

- 带缓冲区的管道。
- 加锁。


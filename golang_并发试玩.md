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

在原生的js中，形成闭包的函数在父作用域生命周期结束之后再内存中保留，go协程完全不同，从现象到机制，go协程只需区分主协程与其他协程，**主协程回收时会回收其他协程，其他协程的回收并不会回收其创建的go协程**，像下面的写法，外层的go协程虽然执行完毕，但是仍然会泄露。

```go
for {
    time.Sleep(1 * time.Microsecond)
    go func() {
    	goroutineLeak2()
    }()
}
```

go协程之间没有父子关系。


接收和发送是一对一的，如果存在多余的发送，则需要等待下一次接收的执行。这在有些时候会稍微麻烦一点，**当发送的次数不定**（协程可能提前终止，或者如果有错误则不发送），在接收端需要通过循环的方式接受，这时在发送端需要适时的将管道关闭，接收操作还有第二个参数（接收是否成功，或者管道是否关闭也可），可以判断这个参数以跳出循环，go的for range操作有对管道类型定制，有个自动判断的语法糖。

```go
package main

func main () {
	ch := make(chan int)
	go func() {
		for i := 0 ; i < 10 ; i ++ {
			ch <- i
		}
		close(ch)
	}()

	for {
		value, ok := <- ch
		if(ok) {
			print(value)
		} else {
			break
		}
	}
	// 或者这样
	//for value := range ch {
	//	print(value)
	//}
}
```

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

上面程序的运行效果是每隔1s打印一次，不保证顺序。上回的泄露说道，如果有阻塞则有泄露的风险，如果发送端的数据由go协程并发生产，那么当消费速度过慢时，会有大量阻塞的go协程，需要引入一个机制去**监控读写不同步的情况**，极度不同步则丢弃数据，避免产生过多go协程而内存溢出。如下，假设接收方处理时间较长，发送方不断发送。

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

可观测到内存快速增长。我们将管道换成带缓冲区的管道可以解决这个问题。原因是在缓冲区满之前不会阻塞发送，这样原本在发送端阻塞的go协程就可以释放。

```go
var ch chan int = make(chan int, 1000000000)
```

更好的解决问题：

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

- 加锁。
- 带缓冲区的管道。

通常，使用一个锁去防止并发写入时可能产生的问题。
```go
var mu sync.Mutex
func WriteToFile( i int, f *os.File, w *sync.WaitGroup ){
    mu.Lock()
    defer mu.Unlock()
    // etc…
}
```

或者使用缓冲区长度为1的管道也可。
```go
var ch chan int = make(chan int, 1)
func WriteToFile( i int, f *os.File, w *sync.WaitGroup ){
    ch <- 1
    defer func(){<- ch}()
    // etc…
}
```

上面的代码利用了缓冲区满写入阻塞的特性，则每次释放之后下一次接收才会执行，保证代码在同一时间只有一个goroutine在执行，也就是并发为1。那么把1换成4，则为并发为4，当然前提是线程安全的代码，这也是缓冲区管道控制并发数的方法。

***多路复用***

有时不希望前面的阻塞后面的接收，这里使用select case语句，每个case语句对应一个管道的收发操作（可以有赋值操作），总是会执行当前不阻塞的*一个*case。


```go
package main

func main () {
	ch := make(chan int)
	ch2 := make(chan int)
	go func() {
		ch <- 0
	}()
	go func() {
		ch2 <- 1
	}()

	select {
		case i := <-ch:
			print(i)
		case i := <-ch2:
			print(i)
	}
}
```

即使看起来两个都不阻塞也会去找一个执行，而不会执行两个。顺便说一下，go的switch case也是这样的。

```go
package main

func main () {
	ch := make(chan int, 1)
	ch2 := make(chan int, 1)
    ch <- 0
    ch2 <- 1
	i := true

	select {
		case i := <-ch2:
			print(i)
		case i := <-ch:
			print(i)
	}
}
```

select也提供default。下面都阻塞则输出default对应的2：

```go
package main

func main () {
	ch := make(chan int, 1)
	ch2 := make(chan int, 1)
	select {
	case i := <-ch2:
		print(i)
	case i := <-ch:
		print(i)
	default:
		print(2)
	}
}
```

***并发的尺度***

我用go协程写了个超慢的斐波那契数列函数。


竟然比js版本的慢了一些，以上说明不能一味的并发，当然不并发也是不对的。怎么做才是正确的？如下：

```go
package main

import "time"

func fib (n int, codeep int) int {
	codeep --
	if(n == 1) {
		return 1
	} else if(n == 2) {
		return 2
	} else {
		if(codeep <= 0) {
			return fib(n - 1, codeep) + fib(n - 2, codeep)
		} else {
			chh := make(chan int, 2)
			go func() {
				chh <- fib(n - 1, codeep)
			} ()
			go func () {
				chh <- fib(n - 2, codeep)
			} ()
			i := <- chh
			j := <- chh

			return i + j
		}
	}
}

func main () {
	t1 := time.Now()
	r := fib(30, 11)
	println(r)
	print(time.Since(t1).Nanoseconds())
	//codeep=1 耗时=4423918
	//codeep=2 耗时=2915501
	//codeep=3 耗时=2235940
	//codeep=4 耗时=1638563
	//codeep=5 耗时=1827314
	// .....
	//codeep=10 耗时=2992178
	//codeep=11 耗时=3293409
}

```

对于递归的函数，通过控制并发调用所在的最大深度来控制并发的程度。可以看到，当深度在4和5左右速度较高。当然，更细粒度的控制以及函数缓存会更大的优化这里的斐波那契数列函数。

***老朋友 promise***

提到并发控制，作为jser我首先想到的是promise，虽然js中的并发是假的。因为golang在同协程下是顺序执行的，实际上用不到yield await这样的关键字，在封装内部使用管道阻塞住即可。


```go
package main

import "time"

func add1 (i, j int) int {
	return i + j
}

func add2 (i, j int) int {
	time.Sleep(time.Second * 2)
	return i + j
}

func main () {
	ret := promiseAll(
		[] <-chan interface{}{
			promiseFunc(func ()interface{} {
			return add1(1,2)
		}), promiseFunc(func ()interface{} {
			return add2(1,2)
		})})
	for _, i := range ret {
		print(i.(int))
	}
}

func promiseFunc (f func () interface{}) <-chan interface{} {
	ch := make(chan interface{})
	go func () {
		ch <- f()
	} ()
	return ch
}

func promiseAll (chs [] <-chan interface{}) []interface{} {
	length := len(chs)
	lock := make(chan bool, length)
	ret := []interface{}{}
	for _, c := range chs {
		for r := range c {
			ret = append(ret, r)
			lock <- true
			break
		}
	}
	<- lock
	return ret
}
```

上面的方法封装了promise（all），现象是add1，add2都返回才会向下执行。也可以实现promiseRace，race需要一个chan共享状态。

```go
package main

import "time"

func add1 (i, j int) int {
	return i + j
}

func add2 (i, j int) int {
	time.Sleep(time.Second * 2)
	return i + j
}

func main () {
	center := make(chan interface{}, 1)
	ret := promiseAll(
		[] <-chan interface{}{
			promiseRace(func ()interface{} {
				return add1(1,2)
			}, center),
			promiseRace(func ()interface{} {
				return add2(1,2)
			}, center)})
	for _, i := range ret {
		print(i.(int))
	}
}

func promiseRace (f func () interface{}, ch chan interface{}) <-chan interface{} {
	received := false
	go func() {
		if received == true {
			return
		}
		ch <- f()
		received = true;
		close(ch)
	} ()
	return ch
}

func promiseAll (chs [] <-chan interface{}) []interface{} {
	length := len(chs)
	lock := make(chan bool, length)
	ret := []interface{}{}
	for _, c := range chs {
		for r := range c {
			ret = append(ret, r)
			lock <- true
			break
		}
	}
	<- lock
	return ret
}
```

- 不要在接收端close管道，因为向已经关闭的管道发送会panic，且没有一个没有副作用的检查管道是否关闭的方法。
- 管道作为参数可以指定传输方向，如`<-chan interface{}`为只能接收的管道。
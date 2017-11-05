***raw server***

hello world

```go
package main
import "net/http"
func main () {
	http.HandleFunc("/", func (res http.ResponseWriter, req *http.Request) {
		res.Write([]byte("hello world"))
	})
	http.ListenAndServe(":4004", nil) // block here
}
```

- go原生http提供路由。
- 原生提供简单404提醒。
- 执行ListenAndServe会阻塞协程。

go原生路由提供一个简易的pattern，pattern match相关代码在[这里](https://golang.org/src/net/http/server.go#L2122)，规则比较奇葩，如果结尾没有`/`是严格匹配，如果结尾有`/`是前缀匹配。

handler函数还有另外一种写法：

```go
package main
import "net/http"
type mainHandler struct {}
func (h mainHandler) ServeHTTP (w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello world"))
}
func main () {
	http.Handle("/", mainHandler{})
	http.ListenAndServe(":4004", nil) // block here
}
```

这稍微有点麻烦，需要先实现http.Handler这个接口。不过其实HandleFunc是基于Handle做的简化（或者说是语法糖也好）。go官方包实现如下：

```
// HandleFunc registers the handler function for the given pattern.
func (mux *ServeMux) HandleFunc(pattern string, handler func(ResponseWriter, *Request)) {
	mux.Handle(pattern, HandlerFunc(handler))
}
```
HandleFunc的实现调用了Handle，并且将传来的函数做了一次类型转化，类型转化则实现了http.Handler，在ServeHTTP中它调用了自身。go官方包实现如下：

```go
type HandlerFunc func(ResponseWriter, *Request)
  
// ServeHTTP calls f(w, r).
func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) {
	f(w, r)
}
```

以上是hello world。冠以原生http的使用，更多的直接使用直接看[这里](https://golang.org/pkg/net/http/)。

***frameworks***

找库时注意维护情况，Issues解决情况，不维护的虽然有参考价值，但不可用在生成环境中（如~~Martini~~）  

- gorilla 一个不错的渐进式工具集。
- gin 有点想express，按照作者的banchmark，gin很有自信的说自己是很快的，具体高在哪里还不知道，作为node玩家，这个框架看着最亲切。
- beego 大而全的mvc框架。

[这个仓库](https://github.com/julienschmidt/go-http-routing-benchmark)做了一个benchmark去对比各个框架的速度，刨除feature的benchmark都是耍流氓，仅供参考。

- httprouter 与原生的mux相比更高效快速，[很多框架都依赖它](https://github.com/julienschmidt/httprouter#web-frameworks-based-on-httprouter)。所以想造轮子的话，httprouter是可以考虑依赖的。

***看看源码***

（贴了这么多码地址，最好把代码保存下来一份）

[ListenAndServe](https://golang.org/src/net/http/server.go#L2880)，调用了包内的Server type的一个实例的[listenAndServe](https://golang.org/src/net/http/server.go#L2627)，然后调用[Serve](https://golang.org/src/net/http/server.go#L2678)，这是个要么不不返回要么返回一个错误，会轮询一个tcp的accept方法（这个accept也封装了，[默认使用keepalive的tcp，socket过期时长为三分钟。](https://golang.org/src/net/http/server.go#L3119)），返回一个socket。然后封装一个conn结构体，随后交给一个协程执行，立即监听下一个tcp连接。

协程里面从[这里开始](https://golang.org/src/net/http/server.go#L1690)，首先会书写关闭的逻辑，以及检测是否是tsl协议，[http1.x的部分从这开始](https://golang.org/src/net/http/server.go#L1728)，这里的代码也体现了keepAlive连接，这里的for循环一直在重复使用之前创建的tcp链接（也就是socket）。

后面从socket中提取编程所需要的req和res对象，在[这里](https://golang.org/src/net/http/server.go#L1801)，终于调用了handle方法，这里使用了一个struct代理了server来调用handle。注意在下一行调用了ctx的cancel方法，这里是为了graceful shutdown。http包抛出了一个[Shutdown方法](https://golang.org/src/net/http/server.go#L2487)，调用shutdown后会被context的done阻塞，直到当前的handle返回。

handle也就是我们的业务逻辑，这个逻辑可以来自两个部分，如[这段代码](https://golang.org/src/net/http/server.go#L2613)所示，如果我们在ListenAndServe中定义了handle，那么不会取路由mux作为handle。这为用户提供了高级功能和低级功能，一般来说，可以在低级功能上创建自己的路由，如上的httprouter。一般来说，不至于自己写一个http的底层。


几个点：
- 关于context是做什么的，看这个就知道了，重点看看他的例子 [http://www.01happy.com/golang-context-reading/](http://www.01happy.com/golang-context-reading/)





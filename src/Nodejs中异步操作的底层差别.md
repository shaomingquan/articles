---
date: 2019-09-21
tags: nodejs
---

> Nodejs主要基于libuv，将一些系统操作通过v8，提供给js。

Nodejs作为一种JavaScript的运行时给js提供了非常丰富的api，这些api中有很多api是异步了，从js的角度来看，它们没有什么大区别（当然功能是不同的），但是从c++的角度来看，区别就比较大了。

大家都知道nodejs底层依赖了epoll这样的系统调用（epoll在linux上，在mac上和windows有其他的系统调用），简单来说，epoll提供的***多路复用***技术真正意义上的从底层实现了多个事件在同一线程上监听，复用在这个上下文中***复用的是线程***。

![](/images/architecture_libuv.png)

Network I/O这部分是可以多路复用的，简单来说，100个tcp通信从底层讲就支持跑在同一个线程。

底层依赖Thread Pool这一部分是不支持多路复用的，libuv用一个线程池支持这部分操作的异步化。以及nodejs官方列出的一些需要Thread Pool的操作，https://nodejs.org/api/cli.html#cli_uv_threadpool_size_size。

当依赖Thread Pool的异步操作过多，且存在耗时长的操作，Thread Pool会被耗尽，性能瓶颈出现。

> Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the 'UV_THREADPOOL_SIZE' environment variable to a value greater than 4 (its current default value) 

正如nodejs官方所言，可以尝试提高`UV_THREADPOOL_SIZE`参数的值。减少Thread Pool相关api的调用次数。又一个非常典型的案例，关于request，在使用nodejs的http client发送一个请求时，需要经过两个步骤：

- 1) 域名解析
- 2) 建立链接发送请求

“建立链接发送请求”这一步没有问题，它是不需要线程池的，request默认使用`dns.lookup`做域名解析，这个调用底层依赖了`getaddrinfo`，无法做多路复用，只能用线程池，所以每个request的dns查询都依赖一个线程，在高并发的情况下，线程数量将成为瓶颈。

nodejs还有个api`dns.resolve`，它只通过网络去做dns解析，不占用线程池，但是需要注意的是他不负责解析`/etc/hosts`。

nodejs也提供了一个配置项，可以按需把默认的dns解析api换掉即可（引用[一个issue](https://github.com/request/request/issues/2491#issuecomment-272273035)的内容）

```js
// in request.js where we create the agent
agent.createConnection = function(args, cb) {
	return net.createConnection({
		port : args.port,
		host : args.host,
		lookup : function(ip, args, cb) {
			return dns.resolve(ip, function(err, ips) {
				if (err) { return cb(err); }
				
				return cb(null, ips[0], 4);
			});
		}
	}, cb);
}
```

或者其实使用一个缓存也行。但无论如何也要nodejs的thread使用情况。
前两个月看了死月的《来一打C++拓展》，趁着还有印象赶紧记录下。对于未曾应用的知识，学习完很容易忘在脑后，这里关注v8和nodejs的赋能，而不是具体的细节，因为不成体系的细节往往需要经过很多的实践才能刻进大脑。关注核心能力和赋能，其他的看demo：

- https://github.com/XadillaX/nyaa-nodejs-demo
- https://v8.dev/docs/embed

### 动机

- c++更快
- 复用c++轮子

v8是一个JavaScript编译器，与其说是js利用v8实现c++拓展，不如说是c++使用v8运行js，也不必可以说实现什么拓展，我们在使用的任何非ECMAscript的api都是c++拓展，不是吗？

### v8概念

- Isolate      ： Isolated Instance，v8主体
- Context      ： 一个沙箱执行环境，比如一个新tab就是一个Context
- Script       ： 一段已经编译好的脚本
- Local Handle ： 内存管理用，在v8中除了Isolate本身，所以一切的东西都受Local句柄管辖，以便于内存管理
- Handle Scope ： 管理一个c++函数内的一组Local Handle，在函数开始声明，在函数结束后Handle Scope的析构函数会delete所有的Local Handle，除非使用`EscapableHandleScope`

Local Handle和Handle Scope也就是内存管理垃圾回收的核心。在nodejs中使用`vm.runInContext()`可以创建一个沙箱，底层就依赖Context，eval就只是在当前context，这是重大的差别。

在之前使用go otto探索js引擎的能力时，我整理了几点基本能力：

- 编译js
- 向js注入数据结构
- 获取js传回的变量

**这样就说得通了，通过注入能力比如是一个异步读文件功能给js使用，js调用时传入回调，c++能拿到这个函数等待真正的调用执行结束，把执行的结构通过这个函数传回给js，就这点事。**于此相关的v8概念：

- Value                   : 泛指js变量
- Template                : 注入能力，模板用来把c++函数或者数据结构包裹进JavaScript，分为函数模板和对象模板
- Accessors&Interceptors  : 拦截，get和set，Interceptors更大范围的拦截

通过Template，将c++能力注入给js。通过Accessor，任何get和set都可能产生副作用，只要你想。

### v8 * nodejs

- NAN       : nodejs使用NAN来抹平nodejs各个版本应用的v8版本api的不同，引用它而不是v8，从而让c++拓展更好的向前兼容
- node-gyp  : 构建工具，依赖python gcc make，管理依赖，像是NAN就是通过targets配置引入的

### libuv * nodejs

libuv概念：
- 循环    : 一个死循环，不停地检查有没有事件被触发以及执行回调
- 句柄    : 一类监听，是长期存在与事件循环中的。比如stream`The basic I/O handle in libuv is the stream (uv_stream_t). TCP sockets, UDP sockets, and pipes for file I/O and IPC are all treated as stream subclasses.`
- 请求    : 比如uv_udp_send_t就是一个udp发送请求，比如uv_udp_t就是udp的响应

```c++
uv_udp_send(&send_req, &send_socket, &discover_msg, 1, (const struct sockaddr *)&send_addr, on_send);

// &send_req类型为     uv_udp_send_t 是一个请求
// &send_socket类型为  uv_udp_t      是一个句柄
// uv_udp_send把请求和句柄连接，并且指定了一个回调
```


应用：
- 使用libuv的内置功能   : 当然，这是核心功能
- 使用libuv内部的线程   : 注意应用锁，线程创建和锁都由libuv提供
- 异步事件唤起事件循环   : 从其他线程回调的结果移交在事件循环中执行

如果异步事件不直接执行呢？因为单个Isolate要在单个线程中执行（死月的书里说的，具体他引用的哪里没找到）

### npm

如果存在gyp文件，则自动执行rebuild，或者指定install脚本

### 总结

整个c++拓展的研发流程和使用到的重点工具

1. 准备构建环境
    1. node-gyp : 构建和依赖
2. 开发
    1. v8 & NAN : v8基础能力
    2. libuv    : nodejs重点能力
3. 发布与迭代
    1. npm      : 发布迭代实践，编译环境问题以及自动化
缓存协商 => 浏览器 vs 服务器。作为网站最前端的一环，浏览器分布在各个用户的设备上，浏览器有缓存的作用，这是一大块对于开发者免费的资源，我觉得浏览器缓存设置比设计网站本身的缓存优先级要高，我们要首先理由手头的资源。而设置浏览器缓存的方式即为，缓存协商。

### 免费资源
浏览器是免费的缓存空间，这本身就很诱人。打开chrome浏览器，在地址栏输入`chrome://cache/`，可以查看chrome缓存的文件。随便找一个访问，发现确实有效果。这里不细展开。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-b132022fc560f784.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
chrome一般可以承载2GB的缓存文件，供所有的网站使用。可以预见在手机端浏览器不可能有这么大的空间给缓存，且再大的空间也有溢出的时候，所以有些前端团队也开发了基于localstorage等技术的缓存，**保证自家站点的一亩三分地**。

### 听谁的？
说了协商就是协商，不存在霸王条款。response和request各自通过http header来控制缓存特性。

response中有`last-modified，expires，ETag，cache-control`。
request中有`if-modified-since，if-none-match，cache-control`。

其中`cache-control`为通用首部，res和req都可以有。`cache-control`中可以加多个指令，指令分为缓存请求指令和缓存相应指令，两者有交集且互相不包含。

### 一步一步来

#### 利用缓存
后端通过nodejs来描述，前端则是chrome最新版。

一个静态资源服务器。如下。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-338fa5c61bd68db4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

反复访问localhost:3000，每次都是这个。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-074f9da1fe244f0b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

实际上已经缓存了，如下在chrome://cache可以查看到。那么如何让浏览器利用到这个缓存呢？第一个方法是让服务器返回`statusCode 304`，**也就是说服务器可以指示浏览器使用缓存**。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-34fe9381b4b36fa9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
在明白如何使用这个缓存之前应该先清楚为何会有这条缓存。我做了一些实验，带缓存响应头或者不带，但是即使一次最简单的请求也依旧缓存下来了。（chrome中）。那么响应头中的缓存header就没有用了吗？现在来看如何使用缓存下来的信息，这些header会有大用途。

需要使用文件操作将Last-Modified信息读出，并且存入环境变量中，这样下文koa中的逻辑就会根据请求报文中的if-modified-since进行对比判断文件是否过期（请求报文中的if-modifed-since实际上是从缓存中拿出来的，而缓存中的响应头当然是从上次相应中得到的），如果fresh为true，代表没有过期，则将程序返回。过期则重新读取。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-9dcd038af55a90a9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 杜绝网络请求

通过304协商这样的方法还是要进行网络请求，幸运的是http提供了max-age指令，让浏览器省略网络请求。

在这里加个配置，便会加一个max-age的指令。


![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-81bd0f3708a97730.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
访问index.html，并且lala.js作为其一个资源。可以发现lala并没有进行网络请求。

![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-7e94e6d9269ce4c1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### Tips
注意到index.html还是做了304协商，因为其作为资源的载体直接被访问，而lala.js则作为资源被访问。在做测试的时候踩的一个坑就是直接通过url访问lala.js结果就是无论如何效果也不符合预期。

实际上当资源被当做载体（通常是html）。chrome默认要求与服务器进行协商（如红框中指令的含义）。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-7c1a15b90e081ee8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

如果点硬性刷新。
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-72d7706088ab2bb3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

则拒绝与服务器发生协商。
![](http://upload-images.jianshu.io/upload_images/2218079-769f512b906f2ff4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里客户端发送max-age=0和no-cache不等价，这个资料说的比较清除 http://stackoverflow.com/questions/1046966/whats-the-difference-between-cache-control-max-age-0-and-no-cache。 简单来说max-age=0具有局限性。

还有一点容易记混的地方是服务端返回no-cache也会存文件的cache，真正达到不存cache的目的需要返回no-store指令。

### ---
作为初级应用这些差不多够用了。
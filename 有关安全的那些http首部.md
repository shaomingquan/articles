### Content-Security-Policy

csp是一种用户代理支持的xss和csrf的控制方案。

- 资源来源白名单。
- 各种资源，包括xhr，worker代码，iframe。
- script-src的nonce，hash值，限制行间脚本。

现在想一想其实一些浏览器的默认行为其实是一些首部的官方推荐参数，比如csp的block-all-mixed-content（HTTPS 网页不得加载 HTTP 资源，浏览器已经默认开启）。

csp中的upgrade-insecure-requests选项对于http迁移https会很有用处，它会控制浏览器自动将网页上所有加载外部资源的http资源的链接换成https格式。

参考资料 https://www.zhihu.com/question/21979782

有一些与csp指令功能重合的非官方标准头： 
- X-Frame-Options
- X-XSS-Protection

对于老旧的或者非官方的头，设置它的意义在于对老版本的保护。

### X-Content-Type-Options

有些资源的Content-Type是错的或者未定义。这时，某些浏览器会启用MIME-sniffing来猜测该资源的类型，解析内容并执行。如下是攻击的例子，在解析二进制的过程中，遇到一个标签，然后就当做html插入进入了。关于这个攻击，在google搜mime based attacks（或者Mime Sniffing Attack）。

![](/images/1510990815vx.png)

### Strict-Transport-Security

告诉浏览器强制使用https访问该资源，相当于用户代理帮服务器做了一次重定向的事，而且这个状态可以缓存，也就是说一段时间内是切不到原来的状态的，参考cache。

### set-cookie的httpOnly选项

由于历史包袱，httpOnly在一般的大型网站中都没有完全使用。目前各大网站使用httpOnly的方式是将cookie分组，在鉴权成功的时候，可以为该域指定多组cookie，方式是写入多个set-cookie首部，个别组可以使用httpOnly策略，现象是使用document.cookie获取的cookie串的长度要小于http请求头中cookie字段的长度，这样对个别关键字段做了保护。

待续。



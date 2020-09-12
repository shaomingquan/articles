helmet给express和koa提供了一些http的安全选项

### CSP

> 详见：https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

限制当前页面使用的外部资源，作用主要有二：

- 减轻xss工具，通过限制脚本资源的协议类型
- 减轻嗅探攻击，通过限制资源协议类型

### CT

> 详见：https://imququ.com/post/certificate-transparency.html
> https://developer.mozilla.org/en-US/docs/Web/Security/Certificate_Transparency

HTTPS 网站的身份认证是通过证书信任链完成的，浏览器从站点证书开始递归校验父证书，直至出现信任的根证书（根证书列表一般内置于操作系统，Firefox 则自己维护）。然而，受信任的 CA（证书颁发机构）有好几百个，他们成为整个网站身份认证过程中一个较大的攻击面。实际上，目前由于 CA 失误导致错误签发证书；**以及个别 CA 出于某些目的（如监控加密流量）故意向第三方随意签发证书这两种情况时有发生。**

Certificate Transparency 的目标是提供一个开放的审计和监控系统，可以让任何域名所有者或者 CA 确定证书是否被错误签发或者被恶意使用，从而提高 HTTPS 网站的安全性。简单地说：就是为合法签发的证书做了一个白名单，谷歌浏览器在验证证书的同时，也会去查看这个证书是不是在白名单里面，如果不在的话，则不会显示绿色地址栏及证书透明度信息。

### referrerPolicy

> 详见：https://developer.mozilla.org/en-US/docs/Web/Security/Referer_header:_privacy_and_security_concerns

默认`no-referrer`。可能带有上个页面url上的信息，有安全隐患，设为 `no-referrer` 彻底关闭referrer功能，或者用`origin`只传递origin

### HSTS

> 详见：https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security

默认是关闭的，不过如果是https开启还是很好的。强制https，一般来说如果想强制https服务端会给http重定向到https，但其实这个请求到重定向的过程也存在中间人攻击问题，HSTS header设置之后，后续由浏览器直接负责重定向，减少了http流量。csp也可以限制https流量，但是做不到缓存这一点。

### MIME sniff

> 详见：https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#MIME_sniffing
> https://www.slideshare.net/RonanDunne1/mime-sniffing-17014318

默认关闭MIME sniff。一些老浏览器会默认做二进制类型分析，会有潜在的脚本注入风险。

### X-DNS-Prefetch-Control

> 详见；https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
> https://blog.compass-security.com/2016/10/bypassing-content-security-policy-with-dns-prefetching/

默认关闭DNS预查询。

> 攻击者在某个Web应用中发现了一个XSS漏洞，他可以利用这个漏洞来向目标Web应用注入某些恶意的JavaScript代码。但是在内容安全策略的保护下，攻击者无法向他所控制的外部服务器发送任何的数据，所以他也就无法获取到用户的隐私数据了

一切的前提是可以注入吧，再加上dns-prefetch可以绕过csp，所以一些信息发送到了攻击者的服务器。而这个dns查询又能泄漏哪些信息呢？带没带cookie？貌似会带cookie。

> 毫无疑问，这项技术确实可以大大降低浏览器加载某些网页所需的时间。但是与此同时，这个功能也将允许攻击者绕过内容安全策略并从浏览器中提取出类似会话cookie以及用户凭证这样的重要数据。接下来，我将会给大家介绍这种攻击技术的实现机制。

有一个误区是，我原本以为浏览器就是通过dns协议解析ip，实际上是真正发生了预请求，顺道把dns办了。这也是这个攻击方式的大前提。

> The implementation of this prefetching in some browsers allows domain name resolution to occur in parallel with (instead of in serial with) the fetching of **actual page content**. By doing this, the high-latency domain name resolution process doesn't cause any delay while fetching content.

### X-Download-Options

默认noopen。用于防止直接打开用户下载文件。用于指定IE 8以上版本的用户不打开文件而直接保存文件。在下载对话框中不显示“打开”选项。

### X-Frame-Options

默认SAMEORIGIN。用于防止点击劫持。不允许跨域的iframe。用csp可以涵盖此功能，在兼容性方面预csp互相补足。

### X-Permitted-Cross-Domain-Policies

Adobe的一些client会用到，flash？这个不 care了

### X-Powered-By

helmet默认将此隐藏。利用此信息，可以定向分析某服务端软件特点，进行攻击。将此隐藏可以提高攻击成本。
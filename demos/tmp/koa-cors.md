> 参考：https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS

在koa-cors中处理了请求中的方法和header，设置了一些跟cors有关的header，帮助浏览器完成跨域请求。

### 请求分流

- 非cors请求，含Origin（不处理）
- 可能是cors请求
    - 非OPTIONS请求
        - 简单请求（处理）
    - OPTIONS请求
        - preflight请求，含Access-Control-Request-Method（处理）
        - 非cors请求（不处理）

### 简单请求处理

- Origin，存在则是cors请求
- Access-Control-Allow-Origin，告知浏览器请求是否可以被响应
- Access-Control-Allow-Credentials，告知浏览器内容是否可被查看

> 将 XMLHttpRequest 的 withCredentials 标志设置为 true，从而向服务器发送 Cookies。因为这是一个简单 GET 请求，所以浏览器不会对其发起“预检请求”。但是，如果服务器端的响应中未携带 Access-Control-Allow-Credentials: true ，浏览器将不会把响应内容返回给请求的发送者，Access-Control-Allow-Credentials的意思就是客户端的Credentials是否合法。

与preflight不一致的header：

- Access-Control-Expose-Headers，允许浏览器访问哪些headers

### preflight请求处理

与简单请求一致的header：

- Origin，存在则是cors请求
- Access-Control-Allow-Origin，告知浏览器请求是否可以被响应
- Access-Control-Allow-Credentials，告知浏览器内容是否可被查看

与简单请求不一致的header：

告知浏览器能力范围：

- Access-Control-Allow-Methods，要请求的方法行不行
- Access-Control-Allow-Headers，要请求的headers行不行，如果不在服务端设置，则直接用浏览器想要的作为值Access-Control-Request-Headers

缓存preflight结果：

- Access-Control-Max-Age，这样就不必每次都preflight了

response:

koa对于preflight请求的response处理是204，此时koa会忽视一切body。其实200也可，控制台也无法查看这个返回。
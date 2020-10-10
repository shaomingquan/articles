---
date: 2020-10-10
tags: js
---

前两个月陆续看了一些electron，electron+chromium，nodejs+chromium，以及结合puppeteer的玩法，或者说就是浏览器编程。觉得挺有场景的，自动化测试啊，爬虫之类的可以用到，包括下面的网站，也是在调研过程中了解到的。

> 什么是“带GUI的浏览器编程”可以看看[https://chrome.browserless.io/](https://chrome.browserless.io/)感受下

### 基本思路

- 获取浏览器二进制(chromium or chrome)
- 启动**浏览器实例**
- 以上帝视角**渲染浏览器的渲染**
- 通过**调试协议**任意操作浏览器

### 获取浏览器

几种方案：

- 用户内置浏览器
- 帮助用户下载浏览器
- 使用electron内置chromium内核

因为内核版本问题，个人不推荐用户内置浏览器

### 启动浏览器实例

- 使用下载的浏览器二进制
- 使用electron内置内核

二进制没啥好说的，直接带参数启动。

electron启动chromium实例的时候可以通过commandLine api加一些参数，可以通过参数启动调试服务，再用puppeteer-core连接这个调试服务即可。参考：

- https://github.com/TrevorSundberg/puppeteer-in-electron
- https://www.electronjs.org/docs/api/command-line

主要启动参数：

- remote-debugging-port
- remote-debugging-address

### 渲染浏览器的渲染

既然是“带GUI的浏览器编程”，就像[https://chrome.browserless.io/](https://chrome.browserless.io/)，浏览器本身并不是我们主要的GUI，甚至有些场景不需要渲染它(headless)。渲染浏览器的渲染，目前我有这几个思路：

- electron的BrowserView
- iframe+Chrome本身的调试工具

BrowserView可以只渲染在当前页面的任意一个位置，electron可以用一些api来操作它，比iframe更灵活，更不受限。

chrome.browserless.io 在服务端serve了一个Chrome的devtool，在Chrome的网站上就能直接curl到本地（[https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F782078%2Fdevtools-frontend.zip?generation=1593039173596680&alt=media](https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F782078%2Fdevtools-frontend.zip?generation=1593039173596680&alt=media)）。然后把自动化脚本加入到cookie，再加载iframe并且带上ws接口地址，服务端就收到了devTool的带脚本的请求，执行就可以了：

```js
const stringifiedCode = encodeURIComponent(code);
document.cookie = `browserless_code=${stringifiedCode}`;
const wsLocation = `${hostname}${port ? `:${port}` : ''}/debugger`;

$debugFrame.src = `/devtools/inspector.html?${secure ? 'wss' : 'ws'}=${wsLocation}`;
```

### 操作浏览器

- Chrome-Debug-Protocol
    - puppeteer
    - playwright
    - electron BrowserView api
    - ...

能启动连接渲染了，操作就不是事儿了。都是基于Chrome调试协议的封装。

### 最后几句

整体思路是这样的，工程细节就不赘述了，比如做多用户可同时分别登录的浏览器编程服务？即使思路有了，并且实现上走得通了，还是得有好idea的，谈工程实现才更有意义。

参考资料：

- https://github.com/ChromeDevTools/awesome-chrome-devtools
- https://www.electronjs.org
- https://github.com/puppeteer/puppeteer
- https://github.com/microsoft/playwright
- https://github.com/browserless/chrome
- https://chromedevtools.github.io/devtools-protocol/
- https://github.com/TrevorSundberg/puppeteer-in-electron
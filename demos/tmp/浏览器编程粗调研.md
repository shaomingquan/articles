### webview

electron

- https://www.electronjs.org/docs/all

社区里有一些类浏览器ui的实现，使用electron的webview功能：
- https://github.com/brrd/electron-tabs
- https://github.com/mengdu/vue-electron-chrome
- https://github.com/pfrazee/electron-browser/blob/master/index.js

webview比iframe功能更强大，甚至可以`<webview>.insertText(text)`，以及下载pdf等等。感觉底层可能跟puppeteer底层其实应该是同一套东西，没提Chrome-devtool-protocol，应该从暴露方式来讲还是不一样的：
- https://www.electronjs.org/docs/tutorial/web-embeds
- https://www.electronjs.org/docs/api/webview-tag

beaker实现了每个tab都可以打开自己的inspector，具体实现还是要看它的源码：
- https://github.com/beakerbrowser/beaker

可能就是这样？

```js
const webview = document.querySelector('webview')
webview.addEventListener('dom-ready', () => {
  webview.openDevTools()
})
```

### puppeteer * electron

社区内有方法可以把puppeteer和electron结合：
- https://github.com/TrevorSundberg/puppeteer-in-electron

通过`new BrowserWindow();`生成的page可以用puppeteer控制，问题是如果在新生成的page中再去拿webview，是否还会受puppeteer的控制？

BrowserWindow实例的webContents和`const webview = document.querySelector('webview')`拿到的webview api几乎一样。问题是不知道是否这个在新页面加载的webview还在puppeteer的管辖范围。puppeteer-in-electron：


```js
const browser = await puppeteer.connect({
    browserWSEndpoint: json.webSocketDebuggerUrl,
    defaultViewport: null
});

return browser;

///////////////////////////////////

const pages = await browser.pages(); // 是否能拿到webview？TO Check
```

用BrowserView可以把新页面渲染到BrowserWindow里，并且通过`browser.pages()`能拿到。对比可以看出BrowserWindow.webContents和webview两者的api是非常像的。比如`contents.loadURL`和`<webview>.loadURL`。看一眼`printToPDF`会感受到两者明显的不同，webContents这一系列的api显然是给nodejs准备的，而`<webview>`这一套返回的是`Promise<Uint8Array>`，是更贴近于chromium的api。（不过其实Buffer跟Uint8Array很像啦，其实就是prototype不一样，它们也可以互相转化）。

- https://www.electronjs.org/docs/api/browser-view

### 阶段性小结

浏览器编程前提和方法：

- 通过puppeteer-core，让pupeteer不默认下载chromium内核，以及通过调试协议（Chrome DevTools Protocol）与当前electron内核链接。参考实现（https://github.com/TrevorSundberg/puppeteer-in-electron）。
- 通过electron的browserView以及browserWindow的`addBrowserView() & removeBrowserView()`方法，可以实现：
    - 单个window下多窗口的渲染
    - `setBounds`实现窗口位置大小改变，可以做拖动，resize
    - 在主线程中，可以吧BrowserView往任意的BrowserWin中放，所以说通过主进程做跨Browser控制是完全可以的
- 可以使用一些高级的api以及最底层的CDP来做浏览器编程：
    - pupeteer
    - browserView api
    - Chrome DevTools Protocol（[chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)）
    - 更多CDP相关：https://github.com/ChromeDevTools/awesome-chrome-devtools，https://chromedevtools.github.io/devtools-protocol/

问题：

- 编写一个完整的浏览器功能effort还是太大了，有没有可能直接调取一个现成的浏览器UI？
    - 已知puppeteer的默认用法是下载一个chromium，如果用这个chromium+headless=false去启动，其实也是一个完整的Chrome
    - 既然puppeteer用CDP就能用，那么直接找到当前用户电脑中的chrome，启动CDPserver不就完了？


### chrome * nodejs

https://chrome.browserless.io/
https://github.com/shaomingquan/chrome
https://hub.docker.com/r/browserless/chrome/
https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac/782078/
https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F782078%2Fdevtools-frontend.zip?generation=1593039173596680&alt=media

browserless挺有意思的，它用了一套清晰的机制，直接把puppeteer跟Chrome结合，然后渲染了Chrome的Devtool。整个demo在：https://chrome.browserless.io/。原理解析

1.用nodejs 直接serve devtool的前端资源

就直接下载然后解压到目录中https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F782078%2Fdevtools-frontend.zip?generation=1593039173596680&alt=media

2.整个https://chrome.browserless.io/的前端页面仅仅分为两个主要的部分
    1.左边是puppeteer脚本内容
    2.右边是个iframe，引入的就是devtool前端资源中的inspect.html

点击按钮的时候先种cookie，再重新加载右边的inspect.html，每次重新加载的时候devtool的时候它会向nodejs发送一个websocket的upgrade

3.生成任务，排队等执行

响应ws upgrade，在puppeteer-provider.js的runWebSocket

```js
////////////////// 任务，会用个简单的队列进行排队，叫q

    const jobProps = {
      browser: null,
      close: () => this.cleanUpJob(job),
      id: jobId,
      onTimeout: () => {
        jobdebug(`${job.id}: Job has timed-out, closing the WebSocket.`);
        socket.end();
      },
      req,
      start: Date.now(),
    };

    const job: IJob = Object.assign(handler, jobProps);


//////////////// 虚拟机

        const handler = new BrowserlessSandbox({
          code,
          opts,
          sandboxOpts: {
            builtin: this.config.functionBuiltIns,
            external: this.config.functionExternals,
            root: './node_modules',
          },
          timeout,
        });
        job.browser = handler;
```

4.启动Chrome沙盒环境

看看BrowserlessSandbox

1 fork child.js

给子进程发code以及一些配置

```js
  constructor({ code, timeout, opts, sandboxOpts }: IConfig) {
    super();

    this.child = fork(path.join(__dirname, 'child'));
    this.timer = timeout === -1 ? null : setTimeout(() => {
      debug(`Timeout reached, killing child process`);
      this.close();
    }, timeout);

    this.child.on('message', (message: IMessage) => {
      if (message.event === 'launched') {
        debug(`Sandbox ready, forwarding location`);
        this.emit('launched', message.context);
      }
    ///...
    ///...

    this.child.send({
      context: {
        code,
        opts,
        sandboxOpts,
      },
      event: 'start',
    });
```

2 等一个消息，拿到port之后，直接把主进程架空，给client和子进程的ws服务建立代理

```js
        handler.on('launched', ({ port, url }) => {
          req.url = url;
          jobdebug(`${job.id}: Got URL ${url}, proxying traffic to ${port}.`);
          this.server.proxy.ws(req, socket, head, { target: `ws://127.0.0.1:${port}` });
        });
```

3 看看child.js

这里面就是启动一个browser和page

```js
  const browser = await launchChrome(opts, false);
  const page = await browser.newPage();
```

看看launchChrome

```js
// 选一个端口
  const port = await getPort();

// 整一个配置
  const launchArgs = {
    ...opts,
    args: [
      ...BROWSERLESS_ARGS,
      ...(opts.args || []),
      `--remote-debugging-port=${port}`
    ],
    // 拿到可知行文件的位置
    // https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteercreatebrowserfetcheroptions
    executablePath: CHROME_BINARY_LOCATION,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
  };


// .....各种操作配置

/// 启动 & 返回
return puppeteer.launch(launchArgs)
```

执行code

```js
  const sandbox = buildBrowserSandbox(page);
  const vm: any = new NodeVM({
    require: sandboxOpts,
    sandbox,
  });

  const handler = vm.run(code); // 这是一个套了module.exports的代码，直接compile出一个function 返回回来，然后加入page执行
  /*
  ` module.exports = async ({ page, context: {} }) => {
        try {
            ${codeWithDebugger}
        } catch (error) {
            console.error('Unhandled Error:', error.message, error.stack);
        }
    }`;
  */

  await handler({ page, context: {} });
```



这样就执行了一次puppeteer脚本，实际上：

- 主进程负责
    - serve statics
    - meta data api
    - 启动Chrome子进程，并且拿到port后代理
- 子进程负责
    - 启动Chrome+puppeteer实例 + code
    - 执行用户脚本

然后前端的devtool inspect.html页面全权负责脚本执行效果的展示
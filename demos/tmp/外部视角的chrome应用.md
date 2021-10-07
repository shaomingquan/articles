1. 单页面快速seo，使用headless特性
2. 使用单独的profile目录搭建特有开发环境（排除插件干扰，添加测试插件，制定测试用户）
3. 做一个cpu profiling https://github.com/paulirish/automated-chrome-profiling

https://vanilla.aslushnikov.com/?Target
Target
Supports additional targets discovery and allows to attach to them.
这个概念有点模糊
Chrome DevTools protocol has APIs to interact with many different parts of the browser - such as pages, serviceworkers and extensions. These parts are called Targets


https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md
讲的是，原生cdp，cdp内部的协议和概念（session，websocket），以及封装一个SEND方法（类http调用方式，puppeteer内部关于connection的封装），以及在puppeteer内部是如何使用原生session的（其实puppeteer把session的概念屏蔽掉了？），通过这种方式可以开启一些实验选项，


- chrome知识图谱
    - 架构
        - 架构概览：http://www.chromium.org/developers/design-documents/displaying-a-web-page-in-chrome
        - 内存模型：
            - https://www.chromium.org/developers/design-documents/process-models
            - http://dev.chromium.org/developers/design-documents/multi-process-architecture
        - v8
            - GC
            - JIT
        - render：https://www.chromium.org/developers/the-rendering-critical-path



 WebKit consists primarily of "WebCore" which represents the core layout functionality, and "JavaScriptCore" which runs JavaScript

 At the lowest level we have our WebKit "port." This is our implementation of required platform-specific functionality that interfaces with the platform-independent WebCore code 对于跨平台的Webcore的平台特定功能的实现（举了一个字体的例子）

 The WebKit "glue" provides a more convenient embedding API for WebKit using Google coding conventions and types 转换层，让第三方库的api更符合google的习惯
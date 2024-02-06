---
date: 2021-08-31
tags: javascript
---

> 参考 https://www.chromium.org/developers/design-documents/process-models

官方说了在overview就说了，chromium支持多种进程模型，以及web演进背景下，chromium的愿景。简单点说，web的动态内容在变多，从document在向application演化，chromium也更多的承担平台的责任，以保证“app”之间的调度和隔离。

chromium支持4种进程模型，用户可以通过启动参数来选择。

### Process-per-site-instance

- 不同站点使用不同进程（pages from different sites are rendered independently）
- 同一站点的不同访问也会被隔离，即使用不同进程（separate visits to the same site are also isolated from each other）

同一站点的相互连接的页面会使用同一进程。相互连接的页面是可以用js互相引用的，比如使用window.open打开的页面。以及对于同一站点的定义也与同源策略有所不同，会把高级域名，端口号不同的站点算作same site。

> 使用window.open打开大chrome实例跟用href打开的有何不同？从进程模型的角度来讲，window.open复用了当前渲染进程，href则是启动了新的进程，官方blog上的解释，window间可以用script引用则是grouped的，这也是site-instance的含义

### Process-per-site

用`--process-per-site`启动，same site的每个tab复用同一个渲染进程，用健壮性换取了一些内存。

### Process-per-tab

与第一种类似，只不过不同站点的也可以了

### Single process

所有tab使用一个进程，最不健壮，最省资源

> Process-per-site-instance产生的进程最多更吃资源，同时最健壮

### tips

- 在同一tab访问跳转不同网站，不会新建process，除非设置了[site-isolation](https://www.chromium.org/developers/design-documents/site-isolation)。
- 子框架复用当前页面进程
- chromium创建的进程数会有限制，如果达到限制，可能会取复用进程


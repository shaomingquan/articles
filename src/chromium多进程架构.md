---
date: 2021-10-03
tags: 软件
---

原文：http://dev.chromium.org/developers/design-documents/multi-process-architecture

> 一些通顺机翻的粘贴，以及不通顺的调整

# 多进程架构

此文档描述了chromium的高级架构。

## 问题

It's nearly impossible to build a rendering engine that never crashes or hangs. It's also nearly impossible to build a rendering engine that is perfectly secure.

构建一个从不崩溃或卡死的渲染引擎是不可能的，同样的，构建一个安全性完美的渲染引擎也是几乎不可能的。

In some ways, the state of web browsers around 2006 was like that of the single-user, co-operatively multi-tasked operating systems of the past. As a misbehaving application in such an operating system could take down the entire system, so could a misbehaving web page in a web browser. All it took is one browser or plug-in bug to bring down the entire browser and all of the currently running tabs.

在某种程度上，2006年前后的web浏览器状态与过去的单用户、多任务协作操作系统类似。在这样的操作系统中，一个发生故障的应用程序可能会破坏整个系统，web浏览器中出现故障的网页也可能如此。只需一个浏览器或插件错误就可以关闭整个浏览器和所有当前运行的选项卡。

Modern operating systems are more robust because they put applications into separate processes that are walled off from one another. A crash in one application generally does not impair other applications or the integrity of the operating system, and each user's access to other users' data is restricted.

现代操作系统更加健壮，因为它们将应用程序放在彼此隔离的单独进程中。一个应用程序中的崩溃通常不会损害其他应用程序或操作系统的完整性，并且每个用户对其他用户数据的访问都受到限制。

> 这段表达的是，浏览器的演进跟操作系统的演进类似，解决的主要问题一致。

## 架构概述

We use separate processes for browser tabs to protect the overall application from bugs and glitches in the rendering engine. We also restrict access from each rendering engine process to others and to the rest of the system. In some ways, this brings to web browsing the benefits that memory protection and access control brought to operating systems.

我们对浏览器选项卡使用单独的进程，以保护整个应用程序不受渲染引擎中的bug和故障的影响。我们还限制每个渲染引擎进程对其他进程和系统其余部分的访问。在某些方面，这让web浏览过程获得内存保护和访问控制这样的安全保护，就像操作系统一样。

> 就是安全的意思

We refer to the main process that runs the UI and manages tab and plugin processes as the "browser process" or "browser." Likewise, the tab-specific processes are called "render processes" or "renderers." The renderers use the Blink open-source layout engine for interpreting and laying out HTML.

我们将运行UI并管理选项卡和插件进程的主进程称为“浏览器进程”或“浏览器”。同样，特定于选项卡的进程称为“渲染进程”或“渲染器”。渲染器使用Blink开源布局引擎来解释和布局HTML。

![](/images/chromium-process-arch.png)

### 管理渲染进程

Each render process has a global RenderProcess object that manages communication with the parent browser process and maintains global state. The browser maintains a corresponding RenderProcessHost for each render process, which manages browser state and communication for the renderer. The browser and the renderers communicate using Chromium's IPC system.

每个渲染进程都有一个全局RenderProcess对象，该对象管理与父浏览器进程的通信并维护全局状态。浏览器为每个渲染进程维护一个对应的RenderProcessHost，它管理渲染器的浏览器状态和通信。浏览器和渲染器使用【Chromium的IPC系统】进行通信。

> 通信的对象，以及通信的方式

### 管理视图

Each render process has one or more RenderView objects, managed by the RenderProcess, which correspond to tabs of content. The corresponding RenderProcessHost maintains a RenderViewHost corresponding to each view in the renderer. Each view is given a view ID that is used to differentiate multiple views in the same renderer. These IDs are unique inside one renderer but not within the browser, so identifying a view requires a RenderProcessHost and a view ID. Communication from the browser to a specific tab of content is done through these RenderViewHost objects, which know how to send messages through their RenderProcessHost to the RenderProcess and on to the RenderView.

每个渲染进程都有一个或多个RenderView对象，由RenderProcess管理，这些对象对应于内容选项卡。相应的RenderProcessHost维护一个RenderViewhost，该RenderViewhost对应于渲染器中的每个视图。每个视图都有一个视图ID，用于区分同一渲染器中的多个视图。这些ID在一个渲染器中是唯一的，但在浏览器中不是唯一的，因此识别视图需要RenderProcessHost和视图ID。从浏览器到特定内容选项卡的通信是通过这些RenderViewHost对象完成的，它们知道如何通过RenderProcessHost将消息发送到RenderProcess并发送到RenderView。

> 这里说了这些概念之间的关系，也是对上图的说明。每个tab是view，这些view可能属于同一个RenderProcess，也可能不是。其实在另一个文档中，这个描述有所体现，也是chrome默认选用的进程模型。（https://www.chromium.org/developers/design-documents/process-models）。且可以看到，每个东西都需要在浏览器进程里有host，且维护相应的从属关系。

### 组件和接口

在渲染进程中

- The RenderProcess handles IPC with the corresponding RenderProcessHost in the browser. There is exactly one RenderProcess object per render process. This is how all browser ↔ renderer communication happens.
- The RenderView object communicates with its corresponding RenderViewHost in the browser process (via the RenderProcess), and our WebKit embedding layer. This object represents the contents of one web page in a tab or popup window

- RenderProcess与浏览器中相应的RenderProcessHost一同处理IPC。每个渲染进程只有一个RenderProcess对象。这是所有浏览器与渲染器通信的方式。
- RenderView对象与浏览器进程中相应的RenderViewHost（通过RenderProcess）进行通信，并且WebKit嵌入层也是。此对象表示选项卡或弹出窗口中一个网页的内容。

> 第二段机翻的可能有问题，可能不只是不通顺的问题。

在浏览器进程中

- The Browser object represents a top-level browser window.
- The RenderProcessHost object represents the browser side of a single browser ↔ renderer IPC connection. - There is one RenderProcessHost in the browser process for each render process.
The RenderViewHost object encapsulates communication with the remote RenderView, and RenderWidgetHost handles the input and painting for RenderWidget in the browser.

- 浏览器对象表示顶级浏览器窗口。
- RenderProcessHost对象表示单个浏览器的浏览器端与渲染器的IPC连接。浏览器进程中的每个渲染进程都有一个RenderProcessHost。
- RenderViewHost对象封装了与远程RenderView的通信，RenderWidgetHost在浏览器中处理RenderWidget的输入和绘制。

有关这些组件如何整合在一起的更多详细信息，请参阅【Chromium如何显示网页】设计文档。

## 共享渲染进程

In general, each new window or tab opens in a new process. The browser will spawn a new process and instruct it to create a single RenderView.

通常，每个新窗口或选项卡都会在新进程中打开。浏览器将生成一个新进程，并指示它创建一个RenderView。

Sometimes it is necessary or desirable to share the render process between tabs or windows. A web application opens a new window that it expects to communicate with synchronously, for example, using window.open in JavaScript. In this case, when we create a new window or tab, we need to reuse the process that the window was opened with. We also have strategies to assign new tabs to existing processes if the total number of processes is too large, or if the user already has a process open navigated to that domain. These strategies are described in Process Models.

有时，有必要或希望在选项卡或窗口之间共享渲染进程。一个web应用程序打开一个新窗口，并且它希望与之同步通信，例如，使用JavaScript中的`window.open`。在这种情况下，当我们创建一个新窗口或选项卡时，我们需要重用现有窗口的进程。如果进程总数太大，或者用户已经有一个进程打开并导航到该域，我们还可以为现有进程分配新的选项卡。这些策略在【进程模型】中描述。

## 检测崩溃或行为异常的渲染器

Each IPC connection to a browser process watches the process handles. If these handles are signaled, the render process has crashed and the tabs are notified of the crash. For now, we show a "sad tab" screen that notifies the user that the renderer has crashed. The page can be reloaded by pressing the reload button or by starting a new navigation. When this happens, we notice that there is no process and create a new one.

与浏览器进程的每个IPC连接都会监视进程句柄。如果这些句柄收到了信号（这个信号就是unix的标准信号），则渲染过程已崩溃，并将崩溃通知选项卡。现在，我们在屏幕显示一个“sad tab”，通知用户渲染器已崩溃。按重新加载按钮或启动新的导航，可以重新加载页面。当这种情况发生时，我们注意到了这里没有进程了，并创建了一个新流程。

> 大概就是浏览器进程或通过信号监视渲染进程，然后浏览器进程会让tab渲染一个兜底的玩意，因为上面也说了，浏览器进程是管ui的，这些tab啥的其实都是ui的一部分

## 沙箱化渲染器

Given the renderer is running in a separate process, we have the opportunity to restrict its access to system resources via sandboxing. For example, we can ensure that the renderer's only access to the network is via its parent browser process. Likewise, we can restrict its access to the filesystem using the host operating system's built-in permissions.

In addition to restricting the renderer's access to the filesystem and network, we can also place limitations on its access to the user's display and related objects. We run each render process on a separate Windows "Desktop" which is not visible to the user. This prevents a compromised renderer from opening new windows or capturing keystrokes.

鉴于渲染器在单独的进程中运行，我们有机会通过沙箱限制其对系统资源的访问。例如，我们可以确保渲染器只能通过其父浏览器进程访问网络。同样，我们可以使用操作系统的内置权限限制它对文件系统的访问。

除了限制呈现程序对文件系统和网络的访问外，我们还可以限制它对用户的显示和相关对象的访问。我们在用户不可见的单独的Windows“桌面”上运行每个渲染进程。这可以防止受损的渲染器打开新窗口或捕获击键。

> 1，是限制与操作系统的急哦阿虎。2，是限制与用户的交互

## 归还内存

Given renderers running in separate processes, it becomes straightforward to treat hidden tabs as lower priority. Normally, minimized processes on Windows have their memory automatically put into a pool of "available memory." In low-memory situations, Windows will swap this memory to disk before it swaps out higher-priority memory, helping to keep the user-visible programs more responsive. We can apply this same principle to hidden tabs. When a render process has no top-level tabs, we can release that process's "working set" size as a hint to the system to swap that memory out to disk first if necessary. Because we found that reducing the working set size also reduces tab switching performance when the user is switching between two tabs, we release this memory gradually. This means that if the user switches back to a recently used tab, that tab's memory is more likely to be paged in than less recently used tabs. Users with enough memory to run all their programs will not notice this process at all: Windows will only actually reclaim such data if it needs it, so there is no performance hit when there is ample memory.

当在渲染器运行在独立进程中，将隐藏的选项卡视为较低优先级就变得很简单。通常，Windows上最小化的进程会将其内存自动放入“可用内存”池中。在内存不足的情况下，Windows会在交换高优先级内存之前将这些内存交换到磁盘，这有助于保持用户可见程序的响应速度更快。我们可以对隐藏的选项卡应用同样的原则。当渲染进程没有顶级选项卡时，我们可以减少该进程的“工作集”大小，以提示系统在必要时先将内存交换到磁盘。因为我们发现，当用户在两个选项卡之间切换时，减少工作集大小也会降低选项卡切换性能，所以我们逐渐释放这一内存。这意味着，如果用户切换回最近使用的选项卡，相比于最近使用较少的选项卡，该选项卡的内存更有可能被分页。有足够内存来运行所有程序的用户根本不会注意到这个过程（Windows实际上只会在需要的时候回收这些数据，所以当有足够的内存时不会影响性能。）

> 这个工作集是个啥？被分页意味着啥？（被载入内存？）

This helps us get a more optimal memory footprint in low-memory situations. The memory associated with seldom-used background tabs can get entirely swapped out while foreground tabs' data can be entirely loaded into memory. In contrast, a single-process browser will have all tabs' data randomly distributed in its memory, and it is impossible to separate the used and unused data so cleanly, wasting both memory and performance.

这有助于我们在内存不足的情况下获得更优化的内存占用。与很少使用的后台选项卡相关联的内存可以完全调出，而前台选项卡的数据可以完全加载到内存中。相比之下，单个进程浏览器的所有选项卡数据将随机分布在其内存中，并且不可能如此干净地分离已使用和未使用的数据，从而浪费内存和性能。

## 插件和扩展

- Firefox-style NPAPI plug-ins ran in their own process, separate from renderers. This is described in detail in Plugin Architecture. 
- The Site Isolation project aims to provide more isolation between renderers, an early deliverable for this project includes running Chrome's HTML/JavaScript content extensions in isolated processes.

- Firefox风格的NPAPI插件在自己的进程中运行，独立于渲染器。这在插件体系结构中有详细描述。
- 站点隔离项目旨在提供渲染器之间的更多隔离，该项目的早期交付成果包括在隔离进程中运行Chrome的HTML/JavaScript内容扩展。

## TODO

- google 2016 面向服务的架构
- 一个小哥的总结 https://www.zhihu.com/people/nian-xi-97/posts
- 网络进程 http://www.chromium.org/developers/design-documents/multi-process-resource-loading
- https://developers.google.com/web/updates/2018/09/inside-browser-part1
- https://docs.google.com/document/d/15I7sQyQo6zsqXVNAlVd520tdGaS8FCicZHrN0yRu-oU/edit#
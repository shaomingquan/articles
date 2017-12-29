先说一下具体如何工作，再从中取引出一些概念，以及关于协议设计的一些东西。

#### 具体流程

一个最简单的webrtc程序是如何工作的呢？以[这个项目](https://github.com/googlecodelabs/webrtc-web/tree/master/step-05)为例，首先安装各种包然后将里面的index.js用node运行起来，这时localhost:8080上是index.html的静态文件，项目中有很多log，有的是客户端的，有的是来自服务器（通过websocket传输，一并在前端打印），访问localhost:8080，打印如下：

```js
Attempted to create or  join room foo
main.js:119 Getting user media with constraints {video: true}
main.js:57 Message from server: Received request to create or join room foo
main.js:57 Message from server: Room foo now has 1 client(s)
main.js:57 Message from server: Client ID HZlWZ5qcSZXaY6u5AAAB created room foo
main.js:37 Created room foo
main.js:106 Adding local stream.
main.js:63 Client sending message:  got user media
main.js:128 >>>>>>> maybeStart()  false MediaStream {id: "8SmbDkjZAnMIX1LGpZdPZQJtIHDSiysGm0KD", active: true, onaddtrack: null, onremovetrack: null, onactive: null, …} false
main.js:57 Message from server: Client said:  got user media
```

> 称第一个客户端为A，第二个客户端为B。

1,首先A会去尝试获取本地流，浏览器会去请求摄像头权限，允许后会触发gotStream回调，参数中获取流，使用window.URL.createObjectURL将流转化成url，放在左侧video标签的src属性上，此时本地流获取成功。

2,A开始尝试在服务器端建立一个房间，关于socket.io房间的用法请访问[这里](https://github.com/socketio/socket.io/blob/1c108a35e499579f978908bac3fb47122ed77ee4/docs/API.md#socketjoinroom-callback)，实际上帮助双端建立了靠谱的tcp桥接，此时等待另一端的连接。
  
至此为A做的事。然后打开B。此时A的console打印如下：

```js
Another peer made a request to join room foo
main.js:47 This peer is the initiator of room foo!
main.js:69 Client received message: got user media
main.js:128 >>>>>>> maybeStart()  false MediaStream {id: "57e9p2ursD8k18GuH45KM2G23YqTZW9gF7JS", active: true, onaddtrack: null, onremovetrack: null, onactive: null, …} true
main.js:130 >>>>>> creating peer connection
main.js:153 Created RTCPeerConnnection
main.js:134 isInitiator true
main.js:180 Sending offer to peer
main.js:196 setLocalAndSendMessage sending message RTCSessionDescription {type: "offer", sdp: "v=0
↵o=- 3212476074762394217 2 IN IP4 127.0.0.1
↵s…6028 label:f1c5a945-be3a-4f71-81e2-06334c4303a3
↵"}
main.js:63 Client sending message:  RTCSessionDescription {type: "offer", sdp: "v=0
↵o=- 3212476074762394217 2 IN IP4 127.0.0.1
↵s…6028 label:f1c5a945-be3a-4f71-81e2-06334c4303a3
↵"}
main.js:57 Message from server: Client said:  {type: "offer", sdp: "v=0
↵o=- 3212476074762394217 2 IN IP4 127.0.0.1
↵s…6028 label:f1c5a945-be3a-4f71-81e2-06334c4303a3
↵"}
main.js:162 icecandidate event:  RTCPeerConnectionIceEvent {isTrusted: true, candidate: RTCIceCandidate, type: "icecandidate", target: RTCPeerConnection, currentTarget: RTCPeerConnection, …}
main.js:63 Client sending message:  {type: "candidate", label: 0, id: "video", candidate: "candidate:211156821 1 udp 2122260223 192.168.1.5 5…eration 0 ufrag LnIL network-id 1 network-cost 10"}
main.js:69 Client received message: {type: "answer", sdp: "v=0
↵o=- 3936124916587118074 2 IN IP4 127.0.0.1
↵s…4523 label:7aff2b36-0fab-493e-9de5-0158daee509f
↵"}
main.js:234 Remote stream added.
main.js:69 Client received message: {type: "candidate", label: 0, id: "video", candidate: "candidate:211156821 1 udp 2122260223 192.168.1.5 4…eration 0 ufrag G7DO network-id 1 network-cost 10"}
main.js:162 icecandidate event:  RTCPeerConnectionIceEvent {isTrusted: true, candidate: null, type: "icecandidate", target: RTCPeerConnection, currentTarget: RTCPeerConnection, …}
main.js:171 End of candidates.
main.js:57 Message from server: Client said:  {type: "candidate", label: 0, id: "video", candidate: "candidate:211156821 1 udp 2122260223 192.168.1.5 5…eration 0 ufrag LnIL network-id 1 network-cost 10"}
```

此时第二个客户端打印如下：

```js
Attempted to create or  join room foo
main.js:119 Getting user media with constraints Object
main.js:57 Message from server: Received request to create or join room foo
main.js:57 Message from server: Room foo now has 2 client(s)
main.js:57 Message from server: Client ID Z22XRvDj2L5D789NAAAC joined room foo
main.js:52 joined: foo
main.js:106 Adding local stream.
main.js:63 Client sending message:  got user media
main.js:57 Message from server: Client said:  got user media
main.js:69 Client received message: Object
main.js:128 >>>>>>> maybeStart()  false MediaStream true
main.js:130 >>>>>> creating peer connection
main.js:153 Created RTCPeerConnnection
main.js:134 isInitiator false
main.js:185 Sending answer to peer.
main.js:196 setLocalAndSendMessage sending message RTCSessionDescription
main.js:63 Client sending message:  RTCSessionDescription
main.js:234 Remote stream added.
main.js:57 Message from server: Client said:  Object
main.js:162 icecandidate event:  RTCPeerConnectionIceEvent
main.js:63 Client sending message:  Object
main.js:57 Message from server: Client said:  Object
main.js:162 icecandidate event:  RTCPeerConnectionIceEvent
main.js:171 End of candidates.
main.js:69 Client received message: Object
```

1,A加入，这是服务端不会触发created事件，所以B中的isInitiator = true不会执行，以此来区分房主和加入者。此时触发joined事件，isChannelReady置为true，至此通道建立完成。

2,此时B开始准备数据流（事实上在与中继服务器建立连接之后再获取流才对。），准备好了之后会发送一个`got user media`已经获取流的Message，中继服务器会广播`got user media`，之后~~双端都会~~A会使用`pc = new RTCPeerConnection(null);`准备一个pc，于此同时A发送offer（向服务器发送一段报文。）服务器转给B，B也会使用`pc = new RTCPeerConnection(null);`准备一个pc，并且answer这个offer，在A接收answer或者B接收offer之后，都会获得一段session信息，双端都会使用`pc.setRemoteDescription(new RTCSessionDescription(message));`来存储握手的session，session获取到之后，pc认为存在合法candidate，于是向对方发送candidate事件，对方收到之后使用`new RTCIceCandidate`建立连接。

3,连接成功之后，由于早已在pc上准备好远程流，所以`handleRemoteStreamAdded`被触发，在回调中将远程流转化成url即可获取远程图像。


#### 协议流程概述

关于webrtc相关的官方文章在[这里](https://developer.mozilla.org/zh-CN/docs/tag/WebRTC)。

单从传输目的不考虑其他因素，因为NAT的限制，只通过tcp/ip协议族转达的内容为不足以穿透NAT以达到P2P连接的效果。所以从P2P连接依赖内容角度去看，还需要一个应用层的方案去交换这些信息，这些信息叫做Media Description采用的规范是[SPD](https://en.wikipedia.org/wiki/Session_Description_Protocol)，用来描述多媒体连接内容的协议，例如分辨率，格式，编码，加密算法等。这一整套叫做ICE（交互式连接建立）。

当然，在建立ICE之前的Media Description交换需要用户自己做一个服务，服务技术选型不限。在ICE建立的过程中，NAT穿透相关方案是对开发者透明的，我们只需要交换，方案主要涉及STUN以及TURN。

建立连接之后，双方接受流进行互推，协议为udp。除了udp，当连接完成之后，可以通过`RTCPeerConnection.prototype.createDataChannel`来建立tcp连接，场景也很容易想，当我们在视频时，也需要传文字，这时候就需要tcp了，应用层协议名为SCTP。

#### 其他玩法

***tcp文字传输***

如下代码，在pc上开一个通道dc，当通道建立连接完毕之后`onopen`触发，此时远端的pc会触发`ondatachannel`事件，从事件对象中取出对面的channel。此时在连接方使用`window.dc.send('fafa')`，在被连接方就可以收到，同样使用`window.receiveChannel.send('gaga')`，连接方也能收到。

```js
if(isInitiator) {
  window.dc = pc.createDataChannel("my channel", null);
  dc.onmessage = function (event) {
    console.log("~~~~~~~received: " + event.data);
  };
  dc.onopen = function () {
    console.log("~~~~~~~datachannel open");
  };
  dc.onclose = function () {
    console.log("~~~~~~~datachannel close");
  };
} else {
  pc.ondatachannel = receiveChannelCallback;
}
```

```js
function receiveChannelCallback(e) {
  window.receiveChannel = e.channel;
  receiveChannel.onmessage = function (event) {
    console.log("~~~~~~~received: " + event.data);
  };
  receiveChannel.onopen = _ => _;
  receiveChannel.onclose = _ => _;
}
```

***多人视频***

多人视频也不难，可以看我写的[例子](https://github.com/shaomingquan/webrtc-multiple-sample)。从上面例子中的代码修改成本会比较高（个人感觉官方的例子会比较绕）。思路就是当一个人加入的时候通知已经加入的人“我要加入了”，服务器会将**加入者**的socketid广播到**其他入局者**那里，当其他入局者收到这个事件会创建一个pc（RTCPeerConnection），在pc上加入本地流，通过pc以及加入者的socketid通过服务器发送给加入者，加入者会收到其他入局者每个人的offer，以及会带着他们每个人的socketid，然后通过socketid将answer发到对应的每个其他入局者那里，收到answer之后再发送candidate事件，收到candicate之后就可以收到远程流了。

加入有n个入局者，那么每个人的pc数目为n-1，所以其实webrtc不适合大型直播应用，主播的客户端不可能同时推那么多流。

#### 协议简析

TODO

#### 其他链接

- [本机webrtc能力检查页](https://test.webrtc.org/)。
- [本地测试页](chrome://webrtc-internals/)。
- [demo合集](https://webrtc.github.io/samples)，[github源码](https://github.com/webrtc/samples)。
- [getting start](https://codelabs.developers.google.com/codelabs/webrtc-web/#0)。

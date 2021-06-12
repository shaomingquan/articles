---
date: 2021-06-13
tags: 软件
---

## 第一个

在bff层需要调用其他服务（http），由于当时属于项目前期也不太规范，大家都是自己写自己的，同事发现他怎么都调用不过去，而我这这边可以。后来发现因为我在调用的时候这边是仅取client的cookie header，而同事那边直接使用client所有header，判断是其中某个header出问题了。好在是很容易排查，就一个一个往下砍验证即可，后来发现是`content-length`，猜测是后端有`content-length`和payload真正长度的校验，且转发header会带错误的content-lengh值，解决方法：

- 去掉这个header，网络lib会带正确的值
- 不校验了即可

## 第二个

在项目切入到正式环境中，原本可以调用的服务突然404，登录这一步都过不去。后来发现在正式环境的那个服务，某一层的ng通过http的host header来分流，而这里的调用还是有上一个例子的问题，直接使用client所有header来调用服务，所以host就是前端的域名，ng根据host把流量切到错误的地方，解决：

- 别透传host

## 启示

- bff复用client header使用白名单
- 不同环境网络环境不同，对header的反馈可能不同
- 研发时的代理可能会让环境失真
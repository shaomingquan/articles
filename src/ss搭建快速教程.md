---
date: 2018-11-02
tags: 软件
---

***1，购买服务器***

使用 [https://my.vultr.com/](https://my.vultr.com/) 买Ubuntu机器 优点：

- 高性价比。日本机器在阿里云腾讯云上都很贵。
- 不用信用卡。虽然没有支付宝等国内支付方式，但PayPal用起来还是挺方便的。

登录服务器，找个目录，执行后续操作。

***2，安装docker***

安装docker：

```sh
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

安装docker-compose [https://docs.docker.com/compose/install/#install-compose](https://docs.docker.com/compose/install/#install-compose)

***3，部署ss服务容器***

[https://hub.docker.com/r/easypi/shadowsocks-libev/](https://hub.docker.com/r/easypi/shadowsocks-libev/)

注意还是要修改一下docker-compose里面的密码。

***4，下载ss客户端***

[https://shadowsocks.org/en/download/clients.html](https://shadowsocks.org/en/download/clients.html)

安装docker-compose文件中的信息填上。

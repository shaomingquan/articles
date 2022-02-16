> Major Node.js versions enter Current release status for six months, which gives library authors time to add support for them. After six months, odd-numbered releases (9, 11, etc.) become unsupported, and even-numbered releases (10, 12, etc.) move to Active LTS status and are ready for general use. LTS release status is "long-term support", which typically guarantees that critical bugs will be fixed for a total of 30 months. Production applications should only use Active LTS or Maintenance LTS releases.

版本分类
- 偶数版本：lts版本（“长期”支持版本）
- 奇数版本：为lts版本铺路使用

想要发布新feature时：

会先在非lts版本铺路，每个非lts版本的生命周期约6个月，伴随着lts版本的release，feature推荐被生产环境使用，同时非lts版本完成它的使命，比如：

- 2020-04-21, Version 14.0.0  最早版本
- 2020-04-29, Version 13.14.0 最晚版本

有一些通用feature或者bugfix以及漏洞修复：

会在还在support期间的lts版本发布比如`CVE-2021-22959: HTTP Request Smuggling due to spaced in headers (Medium)`，在v16，v14，v12的changelog中同时存在。

如上文所说，前提是还在support期间，所以对于v10中不存在`CVE-2021-22959`，因为v10已经结束了30months的support期。

> v12也快到期了，一晃3年了需要换了

> 这种方式不错，在迭代一个多版本周期长的软件时有参考意义
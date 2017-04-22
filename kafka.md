> 项目所需，所以简单了解下。简单及实用，kafka也不是个上手很难的东西，你可以说它是个消息队列（sender/receiver），也可是是一个sub/pub模型，这无所谓，只是思想的侧重点有所不同。

kafka是什么：`A distributed streaming platform`，分布式流平台。分布式意味着它以集群的方式运行，且*易于拓展，弹性较好*。官网首页提到三点。

***PUBLISH & SUBSCRIBE***

to streams of data like a messaging system。意为你可以简单的把它当做为一个简单的订阅者和发布者模型。在前端很常用。

***PROCESS***

streams of data efficiently and in real time。高效，实时（谁也不能说自己不好吧。。）。stream意味着它在服务之间建设了类似`pipelines`的机制，可获得类似`read.pipe(write)`的好处，使对应的效率、可靠程度和资源使用都降低。

***STORE***

streams of data safely in a distributed replicated cluster。说明它有安全保障特性。

上面几点的大体意思就是，*简单，高效，安全*。


##

核心概念

***record***

记录，由一个key，value，和时间戳组成。（为什么跟我在公司的kafka admin上看到的不一样）。会根据时间戳来判断是否过期。

***topic***

用于将记录进行分类。topic中的每个record只有一个元信息，那就是offset。

***partition***

parition是物理上的概念，每个topic包含一个或多个partition，创建topic时可指定parition数量。每个partition对应于一个文件夹，该文件夹下存储该partition的数据和索引文件。每个partition有它的start值，存了某一段offset的record。这样是要提高查询效率。分partition的策略可以使单个topic获得水平拓展的能力。如果一个topic对应一个文件，那这个文件所在的机器I/O将会成为这个topic的性能瓶颈。

逻辑上还是只需要关心topic的概念，producer复制将数据发往不同的分区。

##

五种角色。第一个是kafka集群，下面四种都需要在集群之上工作。

![](/images/1492846976xr.png)

***cluster***

kafka集群。集群中的每台机器分别为一个*Broker*。

***connector***

***stream processor***

node中传输流中的processor的概念，在消费之前做预处理。

***producer***

产生record流。并指定分区，一般来讲 round-robin 即可。

***consumer***

消费record记录。consumer使用组的概念标识自身，消费进程可能在不同机器上，同组之间负载均衡，不同组之间广播。同组的几个消费进程称为一个“逻辑上的订阅者”。消费需要指定分区和topic。有社区帮我们维护这些包，因为kafka cluster的无状态所以第三方包帮我们维护了offset自增的机制，所以具体无需多虑 https://www.npmjs.com/package/kafka-node#consumer。

##

关键策略

***过期策略设计***

不会想想象那样消费即删除，会有相应的过期策略。kafka是否删除record跟消息是否被消费一点关系都没有。有两种过期策略。一是基于时间，二是基于partition文件大小。

***消费者主动***

对于每个消费者都有它自己的一个offset标识partition上的一个record。消费者控制offset的增减去读不同的消息。Kafka的broker是无状态的，它不需要标记哪些消息被哪些consumer过。会一直增长吗？

##

存在即合理，首先想一下kafka解决的问题是？

***降低后端系统的连接复杂度***

比如最开始你的web服务器可能只需要依赖一个数据库服务，当业务越来越复杂，每个附属服务都需要与web服务器单独连接。这样做会有一些问题。***消息冗余***，这条消息需要传达给两个附属服务，直连发送冗余消息。**数据同步的挑战**（暂时无法理解）。那么把kafka加到web服务器和附属服务之间则解决了上面两个问题。总之来讲是**解耦**。

***防止数据丢失***

应对消息激增时服务丢弃消息的情况，相当于做了一层缓冲。

##

那么应用场景是？

***实时监控与分析***

事实上团队内也在搭建实时计算系统中使用kafka。第一足够快，第二降低了消息丢失率，第三服务间解耦了。

***传统的消息系统***

上面也说了，***PUBLISH & SUBSCRIBE***。搭配websocket类似的服务器推技术实现实时性更好的应用。

***分布式应用程序或平台的构件***

网上说的，总之被看中对于kafka也是好事。

## 

那么实际玩一下。




因为工作变动，最近接受一些关于分布式计算的工作，项目的架子已经在之前被同事搭建好了，以便新同学可以快速的加入到计算任务编写上面。这里简单的了解一些storm的各种概念。

**首先**官网上如下说，这里有一些概念

> Why use Storm?

> Apache Storm is a free and open source distributed realtime computation system【1】. Storm makes it easy to reliably process unbounded streams of data, doing for realtime processing what Hadoop【2】 did for batch processing. Storm is simple, can be used with any programming language, and is a lot of fun to use!

> Storm has many use cases: realtime analytics【实时分析】, online machine learning【在线机器学习】, continuous computation, distributed RPC【3】, ETL, and more. Storm is fast: a benchmark clocked it at over a million tuples【元组】 processed per second per node. It is scalable, fault-tolerant【容错的】, guarantees your data will be processed, and is easy to set up and operate.

> Storm integrates with the queueing【4】 and database technologies you already use. A Storm topology【拓扑】 consumes streams【消费流】 of data and processes those streams in arbitrarily complex ways, repartitioning the streams between each stage of the computation however needed. Read more in the tutorial.


【1】实时分布式计算系统。单台机器无法承受计算压力，所以有了它。甚至网上有项目可以让个人pc出一份cpu参与分布式计算。银行集中式的大型机，但大型机过于昂贵，所以对于大多数互联网公司，分布式计算更经济实惠。

【2】Hadoop。主要区分Hadoop，spark，storm的应用场景 https://www.huxiu.com/article/31457/1.html?f=zaker

【3】RPC。简单点讲，RPC框架就是可以让程序员来调用远程进程上的代码一套工具。有了RPC框架，咱程序员就轻松很多了，终于可以逃离多线程、Socket、I/O的苦海了。 https://www.zhihu.com/question/25536695

【4】https://www.zhihu.com/question/34243607

***storm 核心概念***

http://storm.apache.org/releases/1.0.3/Concepts.html

*Topologies*

就是storm的处理节点链接的拓扑网络。

*Streams*

一连串无限的元组。这些元组是平行的分散的（无序）。元组可以任意格式，反正就是个二进制。每个流需要一个名字。

*Spouts*

stream的源头，spout从一个外部资源读元组并且将这些元组发射到拓扑里。从是否可以重放这个维度，可以将stream分为两类：
- reliable
- unreliable
`nextTuple`是一个关键的方法，它会发射一个新元组或者只是返回（当没有新元组时）。`ack`&`fail`也是两个重要的方法，这两个只在`reliable`类型里面生效，旨在通知是否需要重放。

*Bolts*

拓扑中的所有处理都在bolt中进行。如过滤，聚合，入库。可以向下发射多个流，也可以直接返回。

*Stream groupings*

用于定义stream如何在一个bolt的tasks之间分布。举两个例子:

- Shuffle grouping: 乱序分布。
- Fields grouping: 根据某个域进行分组。
- so on...

*Reliability*

必要的时候利用reliable spout的回放功能。

*Tasks*

spout和bolt会作为task分布在集群中（每一个bolt可以是多个task）。

*Workers*

一个物理上的JVM

##

***co(docker, nodejs, storm)***



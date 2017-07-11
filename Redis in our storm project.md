***说说在redis我们项目中的使用。***

就是之前说过的[实时计算项目，这个是一个临时的索引方案](https://github.com/shaomingquan/articles/blob/master/A%20Custom%20Index.md)。

首先，由于一些特殊的原因，项目中采用了[自建redis集群](https://redis.io/topics/cluster-tutorial)，详见前面链接，简单来讲就是在每台机器上启动两个redis实例，再在某台机器上使用文档中给的ruby脚本将所有的机器ip:port串联起来。

***TL;DR***

在项目中我们使用redis做：

- 缓存。
- 累加器。
- 缓冲区。

***缓存***

项目中通常使用[lru-cache](https://www.npmjs.com/package/lru-cache)做一级缓存，lru实例内缓存会防止内存爆炸，但是lru不提供内存级别的限制，所以需要通过自己存储内容的实际大小去选择最多存几条数据。

redis通常是二级缓存。一级缓存满了通常会存在二级缓存中。也是redis最简单的使用，`redis.set,redis.get,redis.setex#带有过期参数的set`。

***累加器***

项目中提供了对指标进行计数的功能，这里使用了[hincrby](https://redis.io/commands/hincrby)，hincrby在操作不存在的哈希表或者哈希表中不存在的值时会自动从零开始加。

当然类似的还有其他版本的累加。

注意这里如果有其他并列的行为发生，注意操作的原子性，原子性操作使用[multi](https://redis.io/commands/multi)即可轻松实现。

***缓冲区***

不但是个缓冲区，而且可以保证缓冲区中的内容可以按照顺序消费。相当于一个简单的消息队列。

方案是`zadd, zrange, zremrangebyrank`。前提条件是在之前的计算节点中，已经计算了每个redis key对应的hash表（value为hash表里的一个属性）。

在计算节点会使用内存级的buffer去存需要取值的key和当前的时间戳（用于zset的排序index）然后每隔一段时间去做zadd操作，这就算是入列了。在下游，每隔一段时间取出一个范围内的的key，删除这个范围内的key，方法是zrange和zremrangebyrank，然后交给下游去落地。

***------***

虽然说不是很难的使用，不过给项目的增益很大。
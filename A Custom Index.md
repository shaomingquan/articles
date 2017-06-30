最近在做实时计算相关的工作，在项目中用了一种基于mysql的索引方案。该方案是我同事设计的（找我同事的话可以私我）。使用该方案，可以实现多维度组合查询，以及简单按单维度分布查询的需求。作为一种敏捷的方案，查询速度和查询的方便程度都很好。

首先我把我们项目中实际的数据精简一下，假设经过计算之后的数据是下面这样的。

```js
{
  metric: 'dau', // 指标
  value: 4,
  tags: { // 维度
    app: 'xxx',
    page: '/pay',
    province: 'liaoning',
    city: 'shenyang'
  }
}
```
现在想实现下面的功能：
- 1,组合查询：
	- 通过app和page组合去查dau。
    - 通过app，province，city去查dau。
- 2,简单的模糊查询：
    - 查看app为xxx，province为yyy下各个city的dau情况。
    
实现组合查询，只需要一张mysql表，字段如下。

`id | metric | primary_hash | value`

- id：每张表都有的东西。
- metric：指标。
- value：指标值。需要注意的是这里的value是累加值，而不是结果。
- hash：索引。

需要根据tag进行维度组合，所以首先需要定义一些维度组合：

```js
[
  ['app', 'page'],
  ['app', 'province', 'city']
]
```
上面定义了需求中的两种维度组合，那么根据所定义的维度，我们需要录入两条数据：对于每一种维度组合，分别将它需要的维度拿出来，得到primary_hash值我们选择，后落到数据库，选择累加或者创建。

在查询的时候，计算对应的primary_hash用where语句就可以了。

***实现模糊查询稍微有些绕***

不过理解之后就感觉没那么复杂。

首先上面的表需要在加一个hash，取名为secondary_hash，那么表结构变为。

`id | metric | primary_hash | secondary_hash | value`

- secondary_hash：已知维度和模糊维度名组合的hash。

这里规定**每个维度组合的最后一个维度名可以用来被模糊查询**。如`['app', 'province', 'city']`可以对city进行模糊查询。

如要实现模糊查询，secondary_hash可以这样存。`[{name: 'app', value: 'xxx'}, {name: 'province', value: 'liaoning'}, city]`。

这样要查询模糊维度时，只要使用**指定的app，province值，指定需要模糊的维度city**，就可以将这些值查出来。问题来了，每一条对应的city的值是什么？这里引入第二张表：

`id | primary_hash | tag_name | tag_value`

在计算过程中将需要模糊查询的tag_name的tag_value值以及对应的primary_hash存起来，这样对于使用secondary_hash取出来的每一条数据，就可以通过他的primary_hash以及需要的tag_name去查对应的tag_value。也就完成了一次模糊查询。

因为tag_name和tag_value的组合会被重复写入，为了复用数据，所以将上面的表拆成两张表，tag_name和tag_value写入另外一张表，通过联表进行关联即可。两张表的结构是这样的。

`id | primary_hash | tag_id`

`tag_id | tag_name | tag_value`

如果维度爆炸的话，后面两张表的压力也很大，这也是做统计都要面对的问题。但我感觉这个方案还是比较能抗的。

这个方案看起来满足了一部分的需求，特点是很省磁盘，但是如果想实现**更专业更复杂**的需求，可能需要考虑使用es之类的方案。如果需求刚好相符，这将是一个小而美的方案 :)。
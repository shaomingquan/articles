---
date: 2021-11-01
tags: nodejs
---

以koa为背景的http路由基本可以分为两步：

1. 准备阶段：准备数据结构
2. runtime阶段：依赖准备阶段的数据结构，根据用户请求，找到应该执行的midwares，compose后执行

### koa-router可能慢在哪里

1. koa-router在准备阶段使用纯线性数据结构，理所应当的在runtime阶段的midwares搜索也是一个线性的时间复杂度，这使得route的性能随着项目的规模在线性变慢
2. koa-router不对路由路径是否有参数进行区分，所有的路径检测都是一个正则表达式的test操作

关于第一点是比较好理解的，那么第二点的影响具体会有多大，做个小实验：

```js
/*
首先用koa-router的同款lib path-to-regexp
准备好1000个path以及对应的regexp
*/

const { pathToRegexp } = require('path-to-regexp');

const charCodeA = 'a'.charCodeAt(0)
const randomChar = () => String.fromCharCode(charCodeA + Math.floor(Math.random() * 26))

const randomPath = n => {
    const coms = []
    for (let i = 0 ; i < n ; i ++) {
        coms.push(randomChar())
    }
    return '/' + coms.join('/')
}

const pathes = []
const pathesRegs = []
for (let i = 0 ; i < 1000 ; i ++) {
    const path = randomPath(3)
    pathes.push(path)
    pathesRegs.push(pathToRegexp(path))
}

// 随机拿一个path，同样使用线性遍历，找到匹配的路径
const s = 1e9;
for (let i = 1 ; i <= 10 ; i ++) {
    let durationEquals = 0
    let toCheckPath = pathes[Math.floor(Math.random() * pathes.length)]
    let result = ''
    for (const path of pathes) {
        const start = process.hrtime()
        if (toCheckPath === path) {
            result = path
        }
        const diff = process.hrtime(start)
        durationEquals += (s * diff[0] + diff[1])
    }
    console.log(`equals: ${i}`, toCheckPath, result, durationEquals)
}


for (let i = 1 ; i <= 10 ; i ++) {
    let durationRegExpText = 0
    let toCheckPath = pathes[Math.floor(Math.random() * pathes.length)]
    let result = ''
    for (const regExp of pathesRegs) {
    
        const start = process.hrtime()
        if (regExp.test(toCheckPath)) {
            result = regExp
        }
        const diff = process.hrtime(start)
        durationRegExpText += (s * diff[0] + diff[1])
    }
    console.log(`regExp test ${i}: `, toCheckPath, result, durationRegExpText)
}

// 结果
/*
equals: 1 /x/v/j /x/v/j 316399
equals: 2 /i/v/y /i/v/y 317208
equals: 3 /x/k/x /x/k/x 355215
equals: 4 /q/s/l /q/s/l 171751
equals: 5 /c/x/q /c/x/q 193422
equals: 6 /i/v/u /i/v/u 147818
equals: 7 /e/k/d /e/k/d 143465
equals: 8 /h/l/j /h/l/j 168824
equals: 9 /h/v/d /h/v/d 144017
equals: 10 /s/s/a /s/s/a 175671
regExp test 1:  /m/t/w /^\/m\/t\/w[\/#\?]?$/i 24158646
regExp test 2:  /g/o/z /^\/g\/o\/z[\/#\?]?$/i 827808
regExp test 3:  /f/q/i /^\/f\/q\/i[\/#\?]?$/i 267779
regExp test 4:  /t/p/z /^\/t\/p\/z[\/#\?]?$/i 254306
regExp test 5:  /q/s/l /^\/q\/s\/l[\/#\?]?$/i 231546
regExp test 6:  /r/d/t /^\/r\/d\/t[\/#\?]?$/i 227686
regExp test 7:  /q/m/o /^\/q\/m\/o[\/#\?]?$/i 269306
regExp test 8:  /m/i/a /^\/m\/i\/a[\/#\?]?$/i 235597
regExp test 9:  /p/g/y /^\/p\/g\/y[\/#\?]?$/i 227333
regExp test 10:  /e/x/f /^\/e\/x\/f[\/#\?]?$/i 255128
*/
```

使用regExp test时，除了前两次性能较差，后续运行test时性能就好很多了，接近equals，我这里暂且认为js的RegExp是有预热的。但毕竟还是要慢一点，可见如果我们并不需要动态路由的时候，最好还是不用regExp。

### 优化思路

- 对于静态路由
    - 不使用正则test
    - 直接使用hashmap数据结构匹配
- 对于动态路由
    - 分段test，对于静态的段不使用regExp
    - 使用trie树数据结构存储分段结构

**个人建议**

- 非必要不使用动态路由
- 非必要不优化
    - router往往也不是瓶颈，经测量，二百多个Layer仅耗时0.2ms
    - 但由于线性增长，接口越多，优化效果越明显

> 可以做但收益不大

> 考虑微服务的场景下，如果上层提供了分流，那么业务层是否要关注呢？或许这对业务来讲是透明的，但根据流量特征，按需注册路由，可以减少路由查找的开销

> 使用koa-router的分组路由写法可以挺高性能吗？结合`use`和`routes`两个方法的源码不难发现，分组路由是用拍平的方式实现的，上文所说的运行时的线性数据结构对此场景依然有效

> 自己实现分组：在很多情况下，我们是需要给路由分组的（分治啊，金字塔原理啊），已知官方通过拍平实现分组，那自己实现就好了（把`routes()`放到运行时，而不是在准备阶段拍平组合）

### TODO

- 了解一下`path-to-regexp`细节，动态路由具体性能。
- 了解一些js的RegExp机制。
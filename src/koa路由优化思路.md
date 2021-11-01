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
// 如果都是静态的路由，且线性的遍历，regExp test耗时是equals的近百倍
// equals:       290373
// regExp test:  23289630

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
const pathesRegs = {}
for (let i = 0 ; i < 1000 ; i ++) {
    const path = randomPath(3)
    pathes.push(path)
    pathesRegs[path] = pathToRegexp(path)
}

const s = 1e9;
// 都从线性的角度来看，匹配1000个备选path
let durationEquals = 0
for (const path of pathes) {
    const start = process.hrtime()
    const ret = path === path
    const diff = process.hrtime(start)
    durationEquals += (s * diff[0] + diff[1])
}
console.log('equals: ', durationEquals)

let durationRegExpText = 0
for (const path of pathes) {
    const regExp = pathesRegs[path]

    const start = process.hrtime()
    const ret = regExp.test(path)
    const diff = process.hrtime(start)
    durationRegExpText += (s * diff[0] + diff[1])
}
console.log('regExp test: ', durationRegExpText)


```

<del>可见如果我们并不需要动态路由的时候，这里的计算其实是浪费的。</del>结果真的是这样吗？我在实际测量接口性能的时候，发现第二次比第一次要快，于是又改造了一下测试代码，如下：

```js
// equals:  337921
// regExp test 1:  27525448
// regExp test 2:  930323
// regExp test 3:  308074
// regExp test 4:  292517
// regExp test 5:  310793
// regExp test 6:  344182
// regExp test 7:  861970
// regExp test 8:  855501
// regExp test 9:  604949
// regExp test 10:  341888
const s = 1e9;
// 都从线性的角度来看，匹配1000个备选path
let durationEquals = 0
for (const path of pathes) {
    const start = process.hrtime()
    const ret = path === path
    const diff = process.hrtime(start)
    durationEquals += (s * diff[0] + diff[1])
}
console.log('equals: ', durationEquals)

// 验证js正则的预热过程
for (let i = 1 ; i <= 10 ; i ++) {
    let durationRegExpText = 0
    for (const path of pathes) {
        const regExp = pathesRegs[path]
    
        const start = process.hrtime()
        const ret = regExp.test(path)
        const diff = process.hrtime(start)
        durationRegExpText += (s * diff[0] + diff[1])
    }
    console.log(`regExp test ${i}: `, durationRegExpText)
}
```

发现除了第一次性能较差，后续运行test时性能就好很多了，接近equals，我这里暂且认为js的RegExp是有预热的

### 优化思路

- 对于静态路由
    - 不使用正则test
    - 直接使用hashmap数据结构匹配
- 对于动态路由
    - 分段test，对于静态的段不使用regExp
    - 使用trie树数据结构

**个人建议**

- 非必要不使用动态路由
- 非必要不优化
    - router往往也不是瓶颈，经测量，二百多个Layer仅耗时0.2ms
    - 但由于线性增长，接口越多，优化效果越明显

> 可以做但收益不大

### TODO

- 了解一下`path-to-regexp`细节，动态路由具体性能。
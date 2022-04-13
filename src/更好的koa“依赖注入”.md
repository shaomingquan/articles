---
date: 2022-04-10
tags: nodejs
---

> 我给“依赖注入”打个引号，避免歧义，因为这里讲的与标准的注入有区别，获取叫“自动挂载”更合适，但正如很多依赖注入那样，它完全是自动化的，且能帮ts文件甚至js文件实现类型提示

### TL;DR

核心思路：

- koa Application类实例中存在context成员，它是每个ctx实例的prototype。相比于在每个ctx上注入成员，在App实例的context成员上操作更佳
- 依托于动态import并约定好依赖注入的规则，可实现自动的ctx注入。并也可以根据目录结构，生产结构化的注入
- 依托于typescript的[Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)特性，可以扩充koa的内部类型，js项目也可因此受益

### 依赖注入的好处

- 降低模块间依赖带来的心智负担
- 更轻易实现按环境注入，比如实现mock功能
- 依赖注入是自动化的，降低了代码结构混乱的概率，减少代码管理负担

### 核心思路

#### koa的context

关于注入koa的context，可以从源码里找到线索

```js
  constructor(options) {
    super();
    options = options || {};
    this.proxy = options.proxy || false;
    this.subdomainOffset = options.subdomainOffset || 2;
    this.proxyIpHeader = options.proxyIpHeader || 'X-Forwarded-For';
    this.maxIpsCount = options.maxIpsCount || 0;
    this.env = options.env || process.env.NODE_ENV || 'development';
    if (options.keys) this.keys = options.keys;
    this.middleware = [];
    // 对每个Application的实例，都会基于公共context为prototype生成一个新的context
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
    // util.inspect.custom support for node 6+
    /* istanbul ignore else */
    if (util.inspect.custom) {
      this[util.inspect.custom] = this.inspect;
    }
  }
```

```js
  createContext(req, res) {
    // 在接收到实际请求的时候，会再以自身的this.context作为prototype，生产具体的ctx
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};
    return context;
  }
```

对于固定的注入，不需要在具体ctx中挂载，在Application实例上挂载即可：

```js
const Koa from 'koa'
const app = new Koa
app.context.a = () => 'a'
app.use(ctx => {
  res.body = ctx.a()
})

app.listen(5436)
```

#### 动态import

- 使用一个glob库，在指定目录捞出所有`index.{js,ts}`
- 再使用node的动态import即可
  - commonjs直接使用require即可
  - 注意mjs和ts是import

### koa-injection

给自己的实现封装出来了 https://github.com/shaomingquan/koa-injection

feature就在仓库里讲吧。。just show code
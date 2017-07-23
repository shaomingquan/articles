**前置知识**

- bloomd过滤器简单使用。
- es6 proxy。
- hashring使用。

我们这边有个去重的服务，使用bloomd，了解bloomd请走这边，这个在这里不是重点 https://github.com/armon/bloomd/。

***现在，去重服务服务需要扩容了。***

无论从client到server都没有支持完备的集群方案。第一版我假设线上的服务器都是稳定的，先排除zookeeper服务稳定性监控的事项，只做压力平衡。

***TL;DR***

- 使用js的Proxy代理调用细节。
- 使用一致性hash均衡压力。

***代理思路***

首先当我们使用bloomd client的api的时候，从代理的角度来看，触发了哪些代理。如下代码。

```js
const exists = yield context.bloomd.checkSafeAsync(filter, value)
```

1, 访问`context.bloomd.checkSafeAsync`时，get handler 拦截到属性访问，属性值为 `checkSafeAsync`。

2, get handler 应该返回一个函数的代理这里记为x，供调用使用，这里需要根据参数的不同返回不同的代理。

3, 执行 `x(filter, value)` 时，apply handler 拦截调用参数。

4, 通过hashring一级filter参数选择一个client，使用方法的原型call client，传入参数。

简化后的代码如下：

```js
let bloomd = require('bloomd');
let Hashring = require('hashring');
let weight = 100;
const _proto = bloomd.BloomClient.prototype;

module.exports = function (hostOptions) {
  
  let hostsClientMap = {};
  let hashringConfig = {};
  let clients = hostOptions.map((option, index) => {
    let _ = {
      client: bloomd.createClient(option),
      option
    }
    hashringConfig[index] = { weight };
    setReconnect(_);
    return _;
  })

  let methodsProxys = {};
  let hashring = new Hashring(hashringConfig);

  let agent = new Proxy({}, {
    get: (target, method) => { // 拦截访问
      if(typeof method === 'string') {
        if(!methodsProxys[method]) {
          let currentProxy; // 这三个方法需要一致性hash
          if(['checkSafeAsync', 'setAsync', 'dropAsync'].indexOf(method) > -1) {
            currentProxy = new Proxy(_ => _, {
              apply: (_, __, args) => {
                let filterName = args[0];
                let index = hashring.get(filterName); // 选机器
                let { client } = clients[index];
                return _proto[method].call(client, ...args);
              }
            }) // 这个方法则需要将各个机器上的数据全拉出来
          } else if(['listAsync'].indexOf(method) > -1) {
            currentProxy = new Proxy(_ => _, {
              apply: async (_, __, args) => {
                let _2dArray = await Promise.all(clients.map(_ => {
                  let client = _.client;
                  return _proto[method].call(client, ...args);
                }))
                return _2dArray.reduce((ret, current) => {
                  return ret.concat(current);
                }, [])
              }
            })
          }
          methodsProxys[method] = currentProxy;
        }
        return methodsProxys[method]; // 返回拦截调用的代理
      }
    }
  });
  return {agent, clients};
}

```

最后返回agent，和原始的clients，使用agent调用bloomd方法则使用集群模式，我们仍然可以任选一个client使用单点模式。

***其实***

也可以通过修改原型方法来实现，但是这样破坏了原本的单实例调用的功能。proxy则保留了原有的调用不受影响，由此可见以后类似的场景可以多用proxy。
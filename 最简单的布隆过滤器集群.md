**前置知识**

- bloomd过滤器简单使用。
- es6 proxy。
- hashring使用。

我们这边有个去重的服务，使用bloomd，了解bloomd请走这边，这个在这里不是重点 https://github.com/armon/bloomd/。

***现在，去重服务服务需要扩容了。***

无论从client到server都没有支持完备的集群方案。第一版我假设线上的服务器都是稳定的，先排除zookeeper服务稳定性监控的事项，只做压力平衡。

***TL;DR***

- 使用一致性hash均衡压力。

***思路***

用一组client，根据filtername用hashring选一个机器。

需要注意的事保证filtername分布均匀，防止出现单点问题。


如下：

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

做一个真正高可用的分布式服务还是很难的，需要考虑极端情况，如果物理机都挂了，即使有svc，pm2什么的也白扯了。需要用zk去做服务发现，我理解的服务发现不一定是发现服务的存在，发现服务的下线更重要。
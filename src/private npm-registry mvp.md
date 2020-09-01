做一个的npm-register的最小闭环

- 能发布，并安装发布的包
- 管理发布权限

### 使用verdaccio

verdaccio是一个全栈的private npm-register的解决方案：

- 仓库：https://github.com/verdaccio/verdaccio
- 文档：https://verdaccio.org/docs/en/installation

使用一个配置就可以配置verdaccio的启动方式，重点包括：

- 上游公有npm-registry的使用方式
- 发布拉取权限配置，以及具体权限信息
- 配置存储

我的配置如下：

- 优先使用cnpmjs
- 不限制拉取，限制发布，发布权限由htpasswd文件控制，管理员控制用户增减，不可注册
- 存储为当前硬盘

```yaml
uplinks:
  npmjs:
    url: https://registry.npmjs.org
    # cache nothing
    cache: false
  cnpmjs:
    url: https://registry.npm.taobao.org
    # cache nothing
    cache: false

packages:

  '**':
    # allow all users (including non-authenticated users) to read all
    # and authenticated to write all
    access: $all
    publish: $authenticated
    # proxy cnpm npmjs for fallback
    proxy: cnpmjs npmjs

storage: ./.verdaccio/storage

auth:
  htpasswd:
    # 密码集合
    file: ./htpasswd
    # 干掉了用户注册
    max_users: -1

web:
  enable: true
  title: "MyNPM"
  primary_color: "#aaa"
  gravatar: true

listen: 0.0.0.0:4873
```

### 启动并使用

1，用一个pm2给verdaccio拉起来，注意无法用cluster模式：

```js
// app.config.js
module.exports = {
    apps : [{
        name: "verdaccio",
        script: "verdaccio --config=verdaccio.config.yaml",
        // 目前不是支持cluster模式的
    }]
}
// pm2 start app.config.js
```

2，在客户端使用npm登录

```sh
npm adduser --registry http://yourcompany.com:4873/
```

3，将带有公司命名空间的pkg发布到registry，比如@yourcompany/test，配置package.json：

```js
"name": "@yourcompany/test",
"publishConfig": {
    "registry": "http://yourcompany.com:4873/"
},
```

4，在项目中配置.npmrc，在某个命名空间使用私有registry，引用带命名空间的pkg即可使用私用registry安装

```js
registry=https://registry.npm.taobao.org/
@yourcompany:registry=http://yourcompany.com:4873/
```

### 给用户分配密码

一个htpasswd密码本是长这样的：

```yaml
zhangsan:{SHA}cwmetXxcHj89Sw44DIY5lpStwik=
lizi:{SHA}y4whicW3dpHVU9uE+n5XHOZSfaA=
wangwu:{SHA}2pbP7XfKfn5D9S91FtrAwCvp73M=
```

这个密码本不是真正的密码，是将真正的密码hash后的，真正的密码存在一台权限比较高的机器上。这个机器上有：

- 授权用户列表
- 根据用户信息生成真正密码的脚本
- 真正的密码

这些是不能被公开的。可以公开的：

- 将真正密码转换成密码本的脚本
- 密码本

如果一个新用户想要发布pkg，需要：

- 在用户列表中添加这个用户
- 使用密码生成脚本生成这个用户对应的密码
- 使用密码本生成脚本生成带这个用户的密码本
- 在服务目录拉代码，重启服务
- 密码交给用户

这一系列流程可以通过内网的入职流程和IM来实现自动化，把权限自动交给相关员工。

一些关键代码：

```js
// 用户列表以及，生成用户密码的脚本
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const profiles = module.exports = {
    salt: 'do you like van youxi?',
    users: [
        'zhangsan',
        'lisi',
        'wangwu',
    ],
    passwords: {},
}

// log their passwords

profiles.users.forEach(user => {
    profiles.passwords[user] = getPassword(user)
})

fs.writeFileSync(
    path.resolve(__dirname, './passwords.json'),
    JSON.stringify(profiles.passwords, ' ', 2)
)

function getPassword(user) {
    return crypto
        .createHash('sha1')
        .update(user + profiles.salt, 'utf8')
        .digest('base64');
}
```

```json
// 生成的真正密码，这个密码会交给具体的用户
{
  "zhangsan": "bUOyvnaD3+cVWew3l1nULlg3vlk=",
  "lisi": "ROa9CchIZ/ZXSpEG8p5jmVCPd/U=",
  "wangwu": "JikObBEo99598NPVB8cKod2yHtw="
}
```

```js
// 生成密码本
const crypto = require('crypto')
const fs = require('fs')
const { users, passwords } = require('/Users/shaomingquan/.npm-registry/passwords.js')

// 给明文密码sha1一下
function getCryptoPassword(password) {
    return `{SHA}${crypto
        .createHash('sha1')
        .update(password, 'utf8')
        .digest('base64')}`;
}

const htpasswd = users.map(user => [user, getCryptoPassword(passwords[user])].join(':')).join('\n')
fs.writeFileSync('./htpasswd', htpasswd)
```

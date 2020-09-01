> 花了点时间将create-react-app和electron做了个结合

目的是：

- 直接复用cra的打包，就不自己玩webpack了
- 利用create-react-app的dev-server，支持renderer进程的页面的实时刷新
- 能复用Facebook cra未来的一些更新

### 让cra配置可重写

希望复用cra未来的一些更新但又需要一些脱离cra配置的功能，除了eject，还可以使用react-app-rewired，使用它加上一些开源社区贡献的插件，可以完成一些定制功能。我在项目里用了下面两个插件：

- react-app-rewire-multiple-entry
- customize-cra

它的原理很简单，利用了require在引用模块时会优先读取cache的特点，react-app-rewired在执行cra的react-script提前读取了它的config，并加载目录下的config-overrides.js文件对配置进行重写，重写后的结果在放到模块的exports属性上。

### electron多页面打包

electron通常需要开发多个page，所以需要让cra支持一下多页面。我的所有页面放在了src/pages下面，所以在config-overrides.js脚本的前面我读了这个目录，把pages都添加到entry中：

```js
// multiple entries
const pagesDir = './src/pages'
const maybePageNames = fs.readdirSync(pagesDir)
const entriesConfig = []

// cra want an index page, but we don't need it. so select arbitrary page for cra.
let appIndexJs = ''
for (const name of maybePageNames) {
  const maybePageDir = path.join(pagesDir, name)
  if (fs.statSync(maybePageDir).isDirectory()) {
    appIndexJs = !appIndexJs ? path.join(maybePageDir, 'index.js') : appIndexJs
    entriesConfig.push({
      entry: path.join(maybePageDir, 'index.js'),
      template: path.join('./public', name + '.html'),
      outPath: '/' + name + '.html'
    })
  }
}
const multipleEntry = require('react-app-rewire-multiple-entry')(entriesConfig);
```

cra的dev-server会默认打开浏览器，这里通用使用rewire一样的方法，给它关了：

```js
// cra auto open browser, rewrite package to disable it. 
const openBrowserDir = 'react-dev-utils/openBrowser'
require(openBrowserDir);
require.cache[require.resolve(openBrowserDir)].exports = () => {}
```

抛出重写hook：

```js
module.exports = {
  paths: function (config, nodeEnv) {
    const nextConfig = Object.assign({}, config)
    nextConfig.appIndexJs = appIndexJs
    nextConfig.publicUrlOrPath = nodeEnv === 'production' ? './' : nextConfig.publicUrlOrPath
    return nextConfig
  },
  webpack: function(config, env) {

    // common settings
    config = common(config)

    // less loader and maimai theme
    // http://lesscss.org/usage/#less-options
    config = addLessLoader({
      modifyVars: Theme,
      javascriptEnabled: true
    })(config);

    // multiple entries
    multipleEntry.addMultiEntry(config);

    // electron target
    config.target = 'electron-renderer'

    return config;
  }
};

```

### electron在线页面加载

dev-server成功启动之后需要封装一个方法，以便与在开发环境和生产环境中都可以正确的加载页面：

```js
export function load (bw, pageName) {
    if (process.env.NODE_ENV === 'development') {
        // develpoment mode load from dev server
        bw.loadURL(`http://localhost:${process.env.REACT_APP_PORT}/${pageName}.html`)
    } else {
        // production mode load from fs
        bw.loadFile(`./${pageName}.html`)
    }
}
```

- 开发环境通过网络读dev-server的资源，html上的各种资源加载也通过http协议
- 生产环境上读在同一个目录下的html文件，html上的各种资源加载也通过file协议

### electron主进程代码打包

electron的特殊性就在于它有个主进程，我暂时把主进程的打包和renderer进程分离了，以便与后面开发更灵活的策略。主进程的打包还是复用cra的打包，这样我们整体的开发方式可以保证统一：

```js
// webpack.main.js
'use strict';
const path = require('path')
const { paths } = require('react-app-rewired')
const semver = require('semver');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

// 与renderer进程公用的配置拓展
const { common } = require('./overrides')

const webpackEnv = process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { scriptVersion } = paths
const scriptPkg = require(`${scriptVersion}/package.json`);
const isWebpackFactory = semver.gte(scriptPkg && scriptPkg.version, '2.1.2');

const webpackConfigPath = `${scriptVersion}/config/webpack.config${!isWebpackFactory ? '.dev' : ''}`;
const mod = require(webpackConfigPath);
const originalCRAConfig = isWebpackFactory
  ? mod(webpackEnv)
  : mod
```

把webpack的config加载出来之后，对其进行更改后使用，主要改动：

- entry output更改
- 移除一些插件，不需要产生页面
- 移除chunk功能，不需要分块加载，electron主进程也没那个能力以及必要

```js
// webpack.main.js 2
module.exports = function() {
  
  originalCRAConfig.entry = {
    'app-main': path.resolve(__dirname, '../src/main/index.js'),
    preload: path.resolve(__dirname, '../src/main/preload.js'),
  },
  originalCRAConfig.output = {
    path: path.resolve(__dirname, '../main-build-' + webpackEnv),
    filename: '[name].js'
  } 

  originalCRAConfig.mode = webpackEnv

  // remove additional HTML
  originalCRAConfig.plugins = originalCRAConfig.plugins.filter(plg => {
    return [
      HtmlWebpackPlugin.prototype, 
      ManifestPlugin.prototype,
    ].indexOf(Object.getPrototypeOf(plg)) === -1
  })

  // no code split
  const { optimization = {} } = originalCRAConfig
  delete optimization.splitChunks
  delete optimization.runtimeChunk

  // runtime 
  originalCRAConfig.target = 'electron-main'

  // common plugins
  return common(originalCRAConfig)
};
```

dev-server和主进程打包差不多了，用一个脚本让他们都执行起来就行了，封装一下类似下面代码：

```js
const startDev = async () => {
    // 可以并行
    await Promise.all([
        // 主进程的dev版本
        buildDevMain(),
        // 启动dev-server
        new Promise((resolve, reject) => {
            runWebpackDevServer({
                onFirstSuccess: resolve,
                onError: reject,
            })
        })
    ])
    // 等待上面的任务都执行成功了，可以把electron的开发环境启动起来了
    runDevElectron()
}
startDev()
```

打包发布也比较简单，注意下publicPath的路径应该是`./`即可。

### tips

- 重写技术的应用前提，在开源项目中没有delete require.cache\['xxx'\]这样的清空require缓存的逻辑，它有权利保证自己的依赖干净。

---
date: 2016-07-02
tags: misc
---

## webpack 简述

webpack学习请访问webpack官网以及github。

跟seajs和requirejs类似，webpack解决前端模块化以及依赖管理，webpack支持commonJS和AMD。与seajs等不同的是，webpack最终部署的项目是各种文件经过编译成的一个或者多个软件包，seajs等直接部署配置文件库文件等。

加载器。可以说是gulp等工具的子功能，常用给的预处理后处理都可以实现，比如less编译，css3前缀的后处理，babel对es6的处理。通过文件后缀和loader的对应，对不同种文件做不同的处理。

webpack提供插件机制，自身提供各种优化策略，包括代码分割，js压缩等。webpack为开发和发布环境提供不同的策略，使用者可以根据环境的不同使用不同的配置。想把这次用webpack做的东西上线，所以研究了一下生产环境webpack配置的事情。

## 正题

webpack的开发模式和生产环境应做较大的区分。事实上所有的开发都是如此。开发过程要求程序修改结果展现实时性比较强，可调试，不良书写以及推荐不使用的warning提示。生产环境要求代码体积最优，不关心调试，无warning，服务器端不需要实时更新前端，只需返回编译后的html。

### 区分环境

使用`process.env.NODE_ENV`区分生产环境还是开发环境，需要设置环境变量来设置这个值，可以使用export命令来设置环境变量，但是无法跨平台。注意使用npm script中的`cross-env`命令进行**跨平台的环境变量设置**，像这样`cross-env NODE_ENV=production`。在npm script中指定环境变量，在程序中即可区分环境的不同选择不同的配置。如下伪代码，使用一个`webpackBaseConfig`保存公共配置。分别编写开发环境和发布环境的独有配置，使用Object.assign覆盖基础配置，得到最终配置。

```js
var webpackBaseConfig = {...};
var webpackDevConfig = {...};
var webpackProductConfig = {...};

var webpackConfig = null;
if(process.env.NODE_ENV === 'product') {
    webpackConfig = Object.assign({}, webpackBaseConfig, webpackProductConfig);
} else {
    webpackConfig = Object.assign({}, webpackBaseConfig, webpackDevConfig);
}
module.exports = webpackConfig;
```

另外可以使用npm中的[config](https://www.npmjs.com/package/config)工具来管理node项目配置。

### 生产环境

#### 代码处理

在开发环境中，I/O速度不受限，不需要关系打包结果的大小，瓶颈在于打包速度，不需要对代码最任何优化，一句话，多一些无脑I/O少一些复杂计算。在开发环境不需要对代码进行处理。在生产环境中：

- 使用`CommonsChunkPlugin`插件降低代码总量。
- 使用webpack的[CODE SPLITTING](http://webpack.github.io/docs/code-splitting.html)技术合理加入代码分割点，避免编译出的软件包的过大。
- 使用`UglifyJsPlugin`对js进行压缩，可以缩小至原来的五分之一，生产环境必备。
- 在`HtmlWebpackPlugin`中配置minify参数，对html进行压缩，效果不大，情怀至上= =。

```js
new HtmlWebpackPlugin({
	filename: '../index.html',
	template: 'index.html',
	inject: true,
	minify: {
		removeComments: true,
		collapseWhitespace: true,
		removeAttributeQuotes: true
	}
})
```
#### 去除warning

warning代表不良的框架或者库的使用，框架开发者为了推进技术而对使用者做出的提醒，不影响系统的使用。在开发过程中难免有暂时无法解决的warning，即便无warning，在生成环境中避免warning检查仍然很必要。使用`DefinePlugin`插件可以去掉react中的warning。加入变量之后react会做判断，如果是production环境则不打印warning。

```js
new DefinePlugin({
	'process.env': {
		NODE_ENV: '"production"'
	}
}),
```

### 开发环境

首先[配置热加载](https://github.com/glenjamin/webpack-hot-middleware#installation--usage)，可以在编程中实时获取变更效果，无需重启服务器无需刷新页面。

因为编译后的代码已经无法阅读，所以需要配置source map，以便在chrome开发工具中可以使用编译前的代码进行调试。添加`devtool: '#source-map'`配置启用source-map。

热加载和source map则需要在生产环境中全部移除。热加载比较耗内存，source map体积比较大。

## 后面

另外，关于开发环境和生产环境在其他层面的区别还有很多值得讨论的东西。比如在开发环境中，我们需要node的热启动，这时可能会使用nodemon这样的工具。在发布环境中则需要pm2这样的工具来保证node进程的稳定性。还需在日后的工作多多学习。

感谢阅读，欢迎补充&指正。
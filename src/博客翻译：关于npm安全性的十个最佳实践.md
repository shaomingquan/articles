
![](/images/npm-10-security-best-practices-CLI.png)

是否关注npm的漏洞？不管是前端或者后端开发者，对于npm安全性的关注都十分重要。开源安全性审计是提高安全性的一个关键的部分，正如你所见甚至npm的官方命令行工具都被发现了[漏洞](https://snyk.io/vuln/search?q=npm&type=npm)，所以最应该关心的应该是npm的安全性。

在这个cheet sheet中，我们将关注一些npm的安全性问题和提高生产力的建议，这些对于源码维护者和开发者都很有用。所以开始我们的10个关于npm安全性的最佳实践吧，从一个典型的错误开始：有些人在npm包的发布中添加了他们的密码。

### 1. 避免发布密码到npm registry

无论你是在用api的秘钥，密码还是其他加密信息，它们最终会由于某些原因被泄露，可能会被泄漏到版本控制系统，甚至被发布到公共的npm registry中。你应该吧加密信息放到一个指定的目录比如`.env`，为了避免被提交到scm，这目录应该被添加到`.gitignore`中。但是当你在这个目录发布一个npm包的时候会发生什么呢？

为了把项目上传到registry， npm的命令行工具会把一个项目打包成一个tar归档（tarball）。下面的标准决定会把哪些文件和目录添加到tarball中。

- 如果存在`.gitignore`或者`.npmignore`两者其中一个文件时，这个文件的内容会为发布包的准备提供一个忽略模式（ignore pattern）。
- 当他们都存在时，不存在于`.npmignore`中的文件都会被发布到registry。这个情况往往是一些困惑的来源，并且是导致泄露加密信息的问题所在。开发者可能z最终更新了`.gitignore` 但是忘记更新`.npmignore`，这会导致潜在的敏感文件没有被发布到版本控制系统，但是仍然被发布到了npm包中。

另一个可选的实践是使用package.json的files属性，他作为一个白名单，指定了将在创建包和安装包时被包含的文件列表。files属性和ignore文件可以一起工作，来决定一个文件最终是否应该被包括在这个包中，排除也是一样的。当一个文件被共同作用时，files属性的优先级高于ignore文件（这也是一个隐患，如果在files被指定，想在ignore中被忽略，是做不到的）。

当一个包被发布了，npm命令行工具会多于的展示被创建的归档。要做到额外的小心，并且在你的发布命令后面添加一个--dry-run参数，为了首先检查tar归档是如果创建的，而不用真正的将它上传到registry上。

在2019年1月，npm官方在博客上做了一个分享，他们添加了一种[自动废除token](https://blog.npmjs.org/post/182015409750/automated-token-revocation-for-when-you)的机制，当他们检测到这个token已经随着一个package一起被上传了。

### 2，强加lockfile

我们张开怀抱拥抱pakcage lock文件的诞生，官方是这样介绍它的：在不同的环境下保持安装的确定性，并且在团队合作中强制依赖。但是当我在package.json中做一个改动却没有提交对应的lock文件，会发生什么呢？

在安装依赖的时候，yarn和npm都是这样的。当他们检测出了package.json和lock文件出不一致是，他们会基于package.json的清单补偿这样的改变，这样可能安装一个与lock文件（上文提到的没有提交的lock文件）不同的版本。

这种情景是有害的，他们会在build过程和生产环境拉取意料之外的包版本，让lock文件的好处都变得徒劳。

Luckily, there is a way to tell both Yarn and npm to adhere to a specified set of dependencies and their versions by referencing them from the lockfile. Any inconsistency will abort the installation. The command line should read as follows:

幸运的是，有一种方法去告诉yarn或者npm参考lock文件去遵守一个特定的依赖集合和版本。任何的不一致会让install过程终止。对应的命令行像下面这样：
- yarn：`yarn install --frozen-lockfile`
- npm：`npm ci`

#### 3. 通过忽略运行脚本来最小化攻击的可操作性

npm 命令行工具与package的run-scripts共同工作，如果你曾经运行npm start和npm test那么你也曾使用过run-scripts。npm命令行工具基于package声明的脚本来构建，并且允许package在其安装的过程中指定切入点（钩子）来运行脚本。举个例子，一些[脚本钩子](https://docs.npmjs.com/misc/scripts)入口是postinstall脚本，当一个package已经完成安装后它就会执行，去做一些杂事。

拥有这些能力，坏人会创建或改造一些package去做一些恶意的行为，方式是当他们的包被安装之后运行任意的随意命令。举两个我们已经看到了的例子，流行的 [eslint-scope](https://snyk.io/vuln/npm:eslint-scope:20180712) 事件，它收集用户的npm token，还有 [crossenv](https://snyk.io/vuln/npm:crossenv:20170802) 事件，连同其他36个package对npm registry进行url hiJacking攻击。

应用这些最佳实践去最小化攻击的可操作性：

始终对您安装的第三方模块进行审核并执行全方位调查，以确认其健康和可信度。

- 不要盲目的升级到新版本；在尝试新版本之前让他们在社区中运行一段时间。
- 在升级之前，一定要去检查升级版本的更新日志，和发行记录。
- 当安装包的时候要确认添加后缀--ignore-scripts去禁止第三方包执行任何脚本。（有些包在postinstall的时候要build的？）
- 考虑添加ignore-scripts到你的.npmrc 项目文件，或者添加到你的全局npm配置中。

### 4. 评估 npm 项目的健康

过期的依赖

如果没有审查发行记录，代码变更，也没有基于全面理解而对更新做全面的测试，就去不断的急着更新到他们的最新发行版，必定不是一个最佳实践。就像上面说过的，保持过时并且一点都不更新，或者很长时间才更新，这也是一种问题的来源。

The npm CLI can provide information about the freshness of dependencies you use with regards to their semantic versioning offset. By running npm outdated, you can see which packages are out of date:

npm命令行工具提供了关于你所用依赖的新鲜度的信息，这与他们的semver的偏移量有关。通过运行npm outdated，你可以查看哪些包是过期的：

![](/images/npm-10-security-best-practices-CLI.png)

黄色的依赖意味着semver与package.json依赖清单中所指示的一致，红色的依赖意味着有更新可用。此外，输出中也展示了每个依赖的最新版本。

询问“医生”

在各种各样的node.js包管理工具之间，并且不同版本的node.js可能被安装到你的path中，你如何证明npm的安装和工作环境是健康的呢？不论你是在开发环境或者CI工具中使用npm命令行工具，评估一切都按预期工作是重要的。

询问“医生”！npm命令行工具内置了一个健康评估工具去诊断你的环境，使它能与npm很好的结合。运行npm doctor去审查你的npm设置：

- 检查官方的npm registry是否可达，并且展示当前配置的registry
- 检查git是否可用
- 审查当前安装的npm和Node.js的版本
- 对不同的目录执行权限检查，比如local和global的node_modules文件夹，还有npm package的缓存文件夹
- 检查本机的模块缓存的校验和正确性

# 5. 对开源依赖的漏洞进行审计

The npm ecosystem is the single largest repository of application libraries amongst all the other language ecosystems. The registry and the libraries in it are at the core for JavaScript developers as they are able to leverage work that others have already built and incorporate it into their code-base. With that said, the increasing adoption of open source libraries in applications brings with it an increased risk of introducing security vulnerabilities.

Many popular npm packages have been found to be vulnerable and may carry a significant risk without proper security auditing of your project’s dependencies. Some examples are npm request, superagent, mongoose, and even security-related packages like jsonwebtoken, and npm validator.

Security doesn’t end by just scanning for security vulnerabilities when installing a package but should also be streamlined with developer workflows to be effectively adopted throughout the entire lifecycle of software development, and monitored continuously when code is deployed.
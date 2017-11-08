***引入本地包***

一个路径对应一个包，一个文件必须使用package指明其所属包，否则编译不通过。

每个路径下的多个文件必须所属同一个包，建议是使用路径的最后一段作为名字包名。存在不属于同一个包的情况则编译不通过。

```go
// a/b
package b // b为包名
```

如果不这样做呢？

```go
package main

import (
  "test"
)

func main () {
  test2.Test()
}
```

test包内部指定包名称为 `test2`，即使路径是test，也需要用test2作为标识符调用，有些奇怪。所以按照建议较好。

本地包导入则按路径索引即可。

***抛出***

大写即抛出，无论是函数函数。注意一点是在编写一个包的时候，run的时候需要run整个目录下的go文件才能达到共享包内部抛出变量的效果。在IDE(gogland)上，设置run kind为directory即可。

```shell
go run pkgtest/*.go
```

***引入线上包***

与npm的集中式包管理不同的是，golang使用url导入包，使用`go get`命令将包下载到本地。

这就是一个线上包。[https://github.com/xxx/tilejs](https://github.com/xxx/tilejs)。

```go
import (
  "github.com/xxx/tilejs"
)
```

如上。直接加入import列表，执行`go get`下载到本地后即可使用。

通过html meta标签的 go-import和go-source可以为当前路径的远程包指定仓库，可能它本身不是一个仓库。

查看git页面源代码也可以发现此元信息。页面作为包的载体指定了协议（一般为git），以及仓库的真正地址。
```html
<meta name="go-import" content="github.com/xxx/tilejs git https://github.com/xxx/tilejs.git">
```

***$GOPATH***

线上包被下载到本地的$GOPATH中。$GOPATH 可以有多个，下载包时使用第一个。解析时从$GOROOT顺着各个$GOPATH挨个查找。在运行时需要导出$GOPATH 环境变量。

☭ export GOPATH="/Users/fff/go/:/Users/fff/2017/gopl/playgroud/package/gopath" ; go run index.go

建议把作为本地仓库的第一个GOPATH写入.base_profile中。那么可以省略前面公共的部分。后面私有的部分作为项目专属的包地址。

☭ export GOPATH="$GOPATH:/Users/fff/2017/gopl/playgroud/package/gopath" ; go run index.go

***包版本***

~~go get总是使用默认分支的head代码。这意味着如果使用传统方法几个版本就要用几个仓库。~~

go get会将整个仓库拉下来，可以通过git命令行工具切换仓库内的代码版本。

可以使用[http://labix.org/gopkg.in](http://labix.org/gopkg.in) 做到将不同版本放到一个仓库中。但是切换版本需要改代码。

通过 [https://github.com/golang/dep](https://github.com/golang/dep) 管理依赖。还有很多可以用的工具，这里是[包管理工具的对比](https://ieevee.com/tech/2017/07/10/go-import.html)，这些工具基本的工作原理都是go的vendor特性（go1.5之后）。

***包更新***

get -u会检查更新，不加-u会服用本地仓库的包。

***内网私有包配置***

[http://www.cnblogs.com/mm200p/p/6626111.html](http://www.cnblogs.com/mm200p/p/6626111.html)

***包查询***

[godoc.org](godoc.org)。


***包冲突***

当包名冲突，编译不通过，这时需要使用别名，如下。

```go
import (
  test3 "github.com/xxx/tilejs"
)
```


***匿名包***

匿名包专用于副作用类型引入。

```go
import (
  _ "github.com/xxx/tilejs"
)
```

导入包默认都是是有名字的，_表示匿名导入包，这里的_并不是语法糖，我在写js的时候经常用_表示语义无关或者用不到的参数，在golang中导入包不使用会有编译错误，除了匿名导入。

副作用实现则是通过闭包特性再加上init函数，init函数对于每个文件来讲是特殊的，每个包的不同文件都可以有自己init，引入包的时候每个文件的init函数都会执行，执行顺序按字母序。

***发布工具***

使用线上包直接是一个main包的时候，那么可以理解为获得了一个工具包，这时使用go get的时候会有build操作，直接生成可执行文件到bin目录下面。事先将$GOPATH/bin设置到$PATH列表中，以便方便使用go工具。

至此gopath里面还有一个pkg目录没有被提及，这个目录存放编译时的中间文件（拓展名为*.a），这是golang编译速度较快的原因之一。

***编译其他平台包***

大部分程序员都在mac和windows上工作，使用golang，不必为了编译支持window平台的可执行文件而找一台window电脑，详见[这里](https://github.com/golang/go/wiki/WindowsCrossCompiling)。一般来说，需要指定操作系统(GOOS)，cpu架构(GOARCH)，以及编译文件的名字以添加系统专属拓展名。

```shell
$ GOOS=windows GOARCH=386 go build -o hello.exe hello.go
```


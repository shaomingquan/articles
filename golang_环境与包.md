***本地包***

一个路径对应一个包，一个文件必须使用package指明其所属包，否则编译不通过。

每个路径下的多个文件必须所属同一个包，建议是使用路径的最后一段作为名字包名。存在不属于同一个包的情况则编译不通过。

```js
// a/b
package b // b为包名
```

如果不这样做呢？

```
package main

import (
  "test"
)

func main () {
  test2.Test()
}
```

test包内部指定包名称为 `test2`，即使路径是test，也需要用test2作为标识符调用，有些奇怪。所以按照建议较好。

***线上包***

与npm的集中式包管理不同的是，golang使用url导入包，使用`go get`命令将包下载到本地。

这就是一个线上包。[https://github.com/shaomingquan/tilejs](https://github.com/shaomingquan/tilejs)。

```
import (
  "github.com/shaomingquan/tilejs"
)
```

如上。直接加入import列表，执行`go get`下载到本地后即可使用。

***$GOPATH***

线上包被下载到本地的$GOPATH中。$GOPATH 可以有多个，下载包时使用第一个。解析时从$GOROOT顺着各个$GOPATH挨个查找。在运行时需要导出$GOPATH 环境变量。

☭ export GOPATH="/Users/fff/go/:/Users/fff/2017/gopl/playgroud/package/gopath" ; go run index.go

建议把作为本地仓库的第一个GOPATH写入.base_profile中。那么可以省略前面公共的部分。后面私有的部分作为项目专属的包地址。

☭ export GOPATH="$GOPATH:/Users/fff/2017/gopl/playgroud/package/gopath" ; go run index.go

***包版本***

go get总是使用默认分支的head代码。这意味着如果使用传统方法几个版本就要用几个仓库。可以使用[http://labix.org/gopkg.in](http://labix.org/gopkg.in)做到将不同版本放到一个仓库中。

***内网私有包配置***

[http://www.cnblogs.com/mm200p/p/6626111.html](http://www.cnblogs.com/mm200p/p/6626111.html)

***包查询***

[godoc.org](godoc.org)。


***包冲突***

当包名冲突，编译不通过，这时需要使用别名，如下。

```
import (
  test3 "github.com/shaomingquan/tilejs"
)
```


***匿名包***

匿名包专用于副作用类型引入。

```
import (
  _ "github.com/shaomingquan/tilejs"
)
```

导入包默认都是是有名字的，_表示匿名导入包，这里的_并不是语法糖，我在写js的时候经常用_表示语义无关或者用不到的参数，在golang中导入包不使用会有编译错误，除了匿名导入。
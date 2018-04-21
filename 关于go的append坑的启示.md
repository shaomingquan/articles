> 我的程序生涯基本上都在写js，最近由于工作最近写了一些golang，在实际使用强类型的偏低级语言的时候，感觉到了一些很不一样的东西。

#### 从一个简单的树形结构说起

看下面代码：

```go
package main

import (
	"encoding/json"
)

type TreeNode struct {
	Val      string     `json:"val"`
	Children []TreeNode `json:"children"`
}

func makeTree() *TreeNode {
	root := TreeNode{}
	root.Val = "0"
	root.Children = []TreeNode{}

	second := TreeNode{}
	second.Val = "1"
	second.Children = []TreeNode{}
	root.Children = append(root.Children, second)

	third := TreeNode{}
	third.Val = "2"
	third.Children = []TreeNode{}
	second.Children = append(second.Children, third)

	return &root
}

func main() {
	root := makeTree()
	ret, _ := json.Marshal(*root)
	println(string(ret))
}
```

最初按照我对js的理解，这段代码应该是work well的。不过返回的json为：

```js
{"val":"0","children":[{"val":"1","children":[]}]}
```

***是的，没有val为2这个节点。***想要的结果是`{"val":"0","children":[{"val":"1","children":[{"val":"2","children":[]}]}]}`。

因为go是偏底层的，所以内存操作没有js那么神秘，而且作为现代语言go也没有c一样的繁琐内存操作。在使用append的时候，实际上是操作一个不定长的数组类型，当增加元素时，go会重新申请内存，将将要append的进去的item复制一份到新内存中，机制简单粗暴。

***放到js中那就是深拷贝了***，所以`root.Children = append(root.Children, second)`这一句中的second被生成副本写入新内存，下文的操作不影响该副本的值。

#### 解决

第一种方法：

```go
package main

import (
	"encoding/json"
)

type TreeNode struct {
	Val      string     `json:"val"`
	Children []TreeNode `json:"children"`
}

func makeTree() *TreeNode {
	root := TreeNode{}
	root.Val = "0"
	root.Children = []TreeNode{}

	second := TreeNode{}
	second.Val = "1"
	second.Children = []TreeNode{}

	third := TreeNode{}
	third.Val = "2"
	third.Children = []TreeNode{}

	second.Children = append(second.Children, third)
	root.Children = append(root.Children, second)

	return &root
}

func main() {
	root := makeTree()
	ret, _ := json.Marshal(*root)
	println(string(ret))
}

```

稍微调整一下位置，让发生复制时的数据是我们想要的数据。这个还有优化的空间，看下面：

```go
package main

import (
	"encoding/json"
)

type TreeNode struct {
	Val      string      `json:"val"`
	Children []*TreeNode `json:"children"`
}

func makeTree() *TreeNode {
	root := TreeNode{}
	root.Val = "0"
	root.Children = []*TreeNode{}

	second := TreeNode{}
	second.Val = "1"
	second.Children = []*TreeNode{}
	root.Children = append(root.Children, &second)

	third := TreeNode{}
	third.Val = "2"
	third.Children = []*TreeNode{}
	second.Children = append(second.Children, &third)

	return &root
}

func main() {
	root := makeTree()
	ret, _ := json.Marshal(*root)
	println(string(ret))
}
```

用一下指针，不用复制实际的内存块，对性能必然有优化，而且。而且按照原有的js的思维，完全work well。

#### 官方教程

[https://blog.golang.org/slices](https://blog.golang.org/slices)。这里面讲了关于slice和append的更深入的理解。

> 好吧。我只是想说，被思维惯性束缚住了，可不是一件好事。
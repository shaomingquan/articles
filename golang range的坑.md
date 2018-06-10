作为go小白，最近开始在公司写go的项目，有一个range的问题让我有些懵逼，找了一些资料无果，后来自己想明白了。

先看代码，下面有四个场景：

```go
package main

type Point struct {
	x int
	y int
}

func withPoint(ps []Point, f func(index int, p *Point)) {
	for index, p := range ps {
		f(index, &p)
	}
}

func main() {

	arr := []Point{}
	for i := 0; i < 10; i++ {
		currentPoint := Point{i, i}
		arr = append(arr, currentPoint)
	}

	// 场景B
	arr2 := make([]*Point, 10)

	withPoint(arr, func(index int, p *Point) {
		arr2[index] = p
	})

	for _, p := range arr2 {
		println(p.x, p.y)
	}
	println("~~~~~")

	// 场景C
	arr3 := make([]*Point, 10)

	for index, p := range arr {
		arr3[index] = &p
	}

	for _, p := range arr3 {
		println(p.x, p.y)
	}
	println("~~~~~")

	// 场景D
	arr4 := make([]*Point, 10)

	for i := 0; i < len(arr); i++ {
		arr4[i] = &arr[i]
	}

	for _, p := range arr4 {
		println(p.x, p.y)
	}
	println("~~~~~")

	// 场景E
	arr5 := make([]*Point, 10)

	for i := 0; i < len(arr); i++ {
		p := arr[i]
		arr5[i] = &p
	}

	for _, p := range arr5 {
		println(p.x, p.y)
	}
}
```
再看打印：
```
9 9
9 9
9 9
9 9
9 9
9 9
9 9
9 9
9 9
9 9
~~~~~
9 9
9 9
9 9
9 9
9 9
9 9
9 9
9 9
9 9
9 9
~~~~~
0 0
1 1
2 2
3 3
4 4
5 5
6 6
7 7
8 8
9 9
~~~~~
0 0
1 1
2 2
3 3
4 4
5 5
6 6
7 7
8 8
9 9
```

我想你可能猜到了我的困惑在哪。

困惑就在于这一连串的9。

最开始遇到这个问题是在场景B。后面又试了场景C，说明不是高阶函数的问题。我开始怀疑是range的问题。试了一下场景D，果然有可能是range的锅。

range有什么问题呢？先看这个 https://stackoverflow.com/questions/15945030/change-values-while-iterating-in-golang。

是copy的问题？抱着试试看的态度我写了场景E的代码，在循环中copy结构体，输出正常，说明不是这个问题。

问题就在于使用range时，变量的特点。***使用range的时候，变量是不重复声明的。在场景C中，p只被声明了一次，也就是说，如果取p的地址，那么每次都是一样的。E则不同，每次p都是新的变量，新的地址。***

打印一下地址看看：

```
~~~~~B
0xc420014090
0xc420014090
0xc420014090
0xc420014090
0xc420014090
0xc420014090
0xc420014090
0xc420014090
0xc420014090
0xc420014090
~~~~~E
0xc4200140a0
0xc4200140b0
0xc4200140c0
0xc4200140d0
0xc4200140e0
0xc4200140f0
0xc420014100
0xc420014110
0xc420014120
0xc420014130
```

bingo，没错。

那也顺带强调一下range的另外一个坑。上文提过了，看这个就行，这里不啰嗦了。https://stackoverflow.com/questions/15945030/change-values-while-iterating-in-golang。

还有range闭包的坑。如果之前有类似js的经验，这个就不算新鲜事了。没听说过的可以搜一下。
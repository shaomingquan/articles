逻辑行，物理行一一对应。

····

while 有 else，break可以跳过，noBreak的语义

····

没有变量提升这个破事（js的变量提升是[为什么](https://stackoverflow.com/questions/15005098/why-does-javascript-hoist-variables)？）

```py
x = 50
def func(x): 
  print('x is', x) // 50
  x=2
  print('Changed local x to', x) // 2
func(x)
print('x is still', x) // 50
```

····

python 函数中的变量默认不支持跨作用域访问，默认情况下都是局部变量，再js中这样可能习以为常：

```py
def f ():
    a = 2
    def g():
        a = 3
    g()
    print a

f()
```

py 中需要生命a为nonlocal模式，这个特性是py3的

```py
def f ():
    a = 2
    def g():
        # nonlocal a py3
        a = 3
    g()
    print a

f()
```

要是做闭包那就可以用这个东西，在py2中也[有方法可以做，只是不太优雅](https://stackoverflow.com/questions/3190706/nonlocal-keyword-in-python-2-x)

····

字符串可以用加法乘法，不同类型的变量不可以运算，没有隐式类型转化。

····

函数的参数列表。

```py
def func(a, b=5, c=10):
    print('a is', a, 'and b is', b, 'and c is', c)
func(3, 7)
func(25, c=24)
func(c=50, a=100)
```

没有缺省值则为必要参数，有缺省值可以不传值，可以指定对应形参。如`func(c=50, a=100)`跳过了b。参数列表就是个字典。

····

rest参数放在前面，因为参数顺序贪婪匹配的特点，rest参数一般放在后面，rest参数放在前面的前提条件是需要指明后续参数在参数字典中的位置。

```py
def f (*params, fn):
    print(params)

def g ():
    pass

f(1, 2, 3, fn=g)
```

这个特性是在python3中才支持的。

····

py是按照PYTHONPATH这个环境变量去找模块的，与linux操作系统找可执行程序一样的方式，实际上golang也是这样。可能与node的包管理机制有所不同。

py的模块不用写抛出（export）逻辑。一个py文件中的所有其他文件都是抛出的。可以引用这个模块，然后以`.`运算符使用模块内的方法，可以引用部分，省去`.`操作，也可以使用通配符，即引用所有也省去`.`操作。不是说推荐省去`.`操作这种引用，使用这种操作的前提是你能保证各个模块内命名不会冲突。三种方式如下：

```py
import mymodule // 1
from mymodule import sayhi // 2
from mymodule import * // 3
```

值得一提的是第三种方式不可以引入__xxx__这种变量。

可以通过__name__这个变量判断模块是被直接运行还是被当做模块被引用，如果被引用。可以作为对模块测试的一种思路吧。

```py
if __name__ == '__main__':
    print('This program is being run by itself')
else:
    print('I am being imported from another module')
```

包。包是模块的文件夹,有一个特殊的 __init__.py 文件,用来表明这个文件夹是特殊 的因为其包含有 Python 模块。

依赖管理 `requirements.txt + pip + virutalenv`。or [buildout](https://github.com/buildout/buildout)。

....

元组(tuple)，列表(list)，有各自的场景。[https://www.zhihu.com/question/37368039/answer/71678495](https://www.zhihu.com/question/37368039/answer/71678495)。

`()`运算符变得微妙，在很多语言中，其为顺序求值。在py中，两种情况，如下。

返回int `a = (12 + 12)`

返回tuple `a = (12 + 12,)`

返回tuple `a = (12, 12)`


....

py中的字典类似于es6中的Map，不过有一点是key只可以是hashable的，也就是key是hash过后的快照，虽然可以用譬如函数这样的复杂类型做key，但是一旦内容变了，即使内存块没变，也无法使用这个key。所以应该类似于js中的可计算key。。如下。。

```js
{
  [a.getHash()]: 1, // key should be a snapshot of hashable obj
  [b.getHash()]: 2,
}
```

至于什么是hashable的？网上回答的比较清楚：[https://stackoverflow.com/questions/14535730/what-do-you-mean-by-hashable-in-python](https://stackoverflow.com/questions/14535730/what-do-you-mean-by-hashable-in-python)。

....

序列和切片：字符串，元组，和列表的统一。用发与Array.prototype.slice类似，如`a4[:-1]`与`slice(0, -1)`一样。与slice相同，py中的切片也是原数据结构的拷贝，修改切片的值不会影响原值。

```py
a4 = [1,2,3]
a5 = a4[:-1] # [1,2]
a5[1] = 1
print a4 # [1,2,3]
```
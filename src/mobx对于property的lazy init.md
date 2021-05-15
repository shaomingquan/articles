---
date: 2021-03-15
tags: javascript
---

> mobx关于`observable.deep`的优化

- 复用度超高的`PropertyDescriptor`
- 延迟初始化对象成员对应的运行时实例，在使用时才初始化

今天突然跟同时重新聊到mobx关于`observable.deep`的优化，突然想到之前在mobx4项目中看到的一段源码：

```js
const enumerableDescriptorCache: { [prop: string]: PropertyDescriptor } = {}
const nonEnumerableDescriptorCache: { [prop: string]: PropertyDescriptor } = {}

function createPropertyInitializerDescriptor(
    prop: string,
    enumerable: boolean
): PropertyDescriptor {
    const cache = enumerable ? enumerableDescriptorCache : nonEnumerableDescriptorCache
    return (
        cache[prop] ||
        (cache[prop] = {
            configurable: true,
            enumerable: enumerable,
            get() {
                initializeInstance(this)
                return this[prop]
            },
            set(value) {
                initializeInstance(this)
                this[prop] = value
            }
        })
    )
}
```

看函数名就知道了，为一个observable生成一组descriptor。mobx这里有点野，巧妙了利用了closure和执行上下文，做到了相同的prop都可以复用同一组descriptor，而且一般来讲，在一个项目中一个大块数据里面肯定是有很多重复的props的，所以这个设计可以做到：

***如果仅仅是赋值到一个observable.deep上，而不去读写，占用的额外空间极低。***

接下来有些prop上会发生具体的读写，会开始真正的初始化逻辑，也就是`initializeInstance(this)`，看看这个玩意：

```js
export function initializeInstance(target: DecoratorTarget) {
    if (target.__mobxDidRunLazyInitializers === true) return
    const decorators = target.__mobxDecorators
    if (decorators) {
        addHiddenProp(target, "__mobxDidRunLazyInitializers", true)
        for (let key in decorators) {
            const d = decorators[key]
            // note!
            d.propertyCreator(target, d.prop, d.descriptor, d.decoratorTarget, d.decoratorArguments)
        }
    }
}
```

`propertyCreator`又是个啥？由于匿名函数传递层数过多，这里只列重点：

```js
(
    target: any,
    propertyName: string,
    descriptor: BabelDescriptor | undefined,
) => {
    const initialValue = descriptor
        ? descriptor.value
        : undefined
    defineObservableProperty(target, propertyName, initialValue, enhancer)
}

export function defineObservableProperty(
    target: any,
    propName: string,
    newValue,
    enhancer: IEnhancer<any>
) {
    const adm = asObservableObject(target)

    // note!
    const observable = (adm.values[propName] = new ObservableValue(
        newValue,
        enhancer,
        `${adm.name}.${propName}`,
        false
    ))
    newValue = (observable as any).value // observableValue might have changed it

    // note！
    Object.defineProperty(target, propName, generateObservablePropConfig(propName))
    if (adm.keys) adm.keys.push(propName)
    notifyPropertyAddition(adm, target, propName, newValue)
}
```

可以发现：

- 真正干活的东西`new ObservableValue`，被实例化了，且只实例化一次
- descriptor被改写了，实现了模式的切换（开始干活模式）

descriptor是可以被改写的，像下面这样：

```js
Object.defineProperty(a, 'a', {
  configurable: true,
  enumerable: true,
  get() {
    // 改写descriptor
    Object.defineProperty(a, 'a', {
      configurable: true,
      enumerable: true,
      get() {
        return 2
      },
      set(value) {
        this._a = value
      }
    })
    return 1
  },
  set(value) {
    this._a = value
  }
})

a.a
// 1
a.a
// 2
```

总结下，mobx在初始化阶段做了几个优化：

- 使用时初始化，节省未使用成员的内存
- 初始化用的descriptor的高度复用，进一步节省内存
- 初始化后的descriptor切换到工作模式，以完全跳过初始化判断逻辑，可以节省一些逻辑判断

用时初始化+改写的方式在业务代码中也可以使用，比如：

有一个类A，依赖了另一个类B，想要A在调用B相关功能时再初始化，这时候其实可以加一个改写，让后面的逻辑都不需要判断初始化状态，先正常去写：

```js
function A() {
    this.b = new B
}

A.prototype.useB = async function () {
    // 每次判断init状态    
    if (b.inited) {
        this.useBImpl()
    } else {    
        await this.b.init()
        this.useBImpl()
    }
}

A.prototype.useBImpl = async function () {}
```

重写。

```js
function A() {
    this.b = new B
}

A.prototype.useB = async function () {
    await this.b.init()
    this.useBImpl()
    // 直接改写，永远不判断了        
    A.prototype.useB = A.prototype.useBImpl
}

A.prototype.useBImpl = async function () {}
```

不要轻易用，可能会被骂。
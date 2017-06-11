react的warning经常提示用户去给子元素加key属性。

那么这个key有什么用呢？应该怎么用？

**为什么要用key？**

几个字概括：省dom操作。

如下例子：当第一个被移到最后一个，此时dom的操作为insertAfter。但如果去掉key则会销毁整个子dom，影响效率。使用“检查元素”易验证。

但使用简单追加元素的例子并不能提现key的作用，处于追加内容之前的dom仍然被复用。

```js
render() {
    let list = this.state.list;
    let _this = this;
    return <div>
      <input type="button" value="add" onClick={_ => _this.setState({
          list: list.concat(list.shift())
      })}/>
      {list.map((_, index) => {
        return <div key={_}>{_}</div>
      })}
    </div>
  }
```

**用法**

原则上要使用可以标识组件内容的key。下面是典型误用：

误用的结果是虽然不报warning了，但是效果上跟没有加key是一样的。典型的还有每次加不同的唯一id。

```js
{list.map((_, index) => {
    return <div key={index}>{_}</div>
})}
```




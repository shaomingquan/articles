> 提到context，事实上我第一个想到的是javascript中的this，javascript是词法作用域，this提供了动态作用域的特点。

以我目前的理解，上下文一定程度上起到了将大问题拆解的作用。在koa中，一个特定的http生命周期中，this作为上下文起到了承上启下的作用，串联了http生命周期。

go的context则是：

- 串联了整个goruntine创建的管理。
- 保障没有goruntine未被释放。
- 保障goruntine之间的共享变量的读取没有data race。

**context串联了goruntine的生命周期，统一管理。**

#### 使用举例：

在下面代码中，开了两个goruntine，通过携带value的ctx去将变量共享（注意，当变量取出来之后就不是线程安全的了）。当主goruntine要求退出的时候，两个goruntine一并退出。

开发者需要在ctx.done释放的时候处理程序的善后。

```go
package main

import (
	"context"
	"time"
)
func main() {

	gen2 := func(ctx context.Context) {
		go func() {
			for {
				select {
				case <-ctx.Done():
					println(ctx.Value("k").(string))
					println("2 done")
					return // returning not to leak the goroutine
				}
			}
		}()
	}

	gen1 := func(ctx context.Context) {

		gen2(ctx)

		go func() {
			for {
				select {
				case <-ctx.Done():
					println(ctx.Value("k").(string))
					println("1 done")
					return
				}
			}
		}()

	}

	root := context.Background()
	ctxWithCancel, cancel := context.WithCancel(root)
	ctx1 := context.WithValue(ctxWithCancel, "k", "v")
	gen1(ctx1)

	cancel()
	time.Sleep(time.Second * 1)

}
```


#### 源码分析：



以cancel为例：

cancelCtx 结构体定义：

```go
type cancelCtx struct {
	Context

	mu       sync.Mutex            // protects following fields
	done     chan struct{}         // created lazily, closed by first cancel call
	children map[canceler]struct{} // set to nil by the first cancel call
	err      error                 // set to non-nil by the first cancel call
}
```

cancelCtx 的生成：

```go
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
	c := newCancelCtx(parent)
	propagateCancel(parent, &c)
	return &c, func() { c.cancel(true, Canceled) }
}

// newCancelCtx returns an initialized cancelCtx.
func newCancelCtx(parent Context) cancelCtx {
	return cancelCtx{Context: parent}
}

// propagateCancel arranges for child to be canceled when parent is.
func propagateCancel(parent Context, child canceler) {
    // 1，被关闭的管道是nil，所以可以用来判断父context是否被cancel。
    // 2，如果父ctx是background，也是nil，无需处理。
	if parent.Done() == nil {
		return
	}
    // 顺着树向上找到到cancelable类型的ctx
	if p, ok := parentCancelCtx(parent); ok {
		p.mu.Lock()
        // 如果父ctx已经被取消，直接取消子ctx
		if p.err != nil {
			// parent has already been canceled
			child.cancel(false, p.err)
		} else {
            // 无论是谁派生的子ctx，统统挂在最近的cancel ctx上，以便后续递归cancel。
			if p.children == nil {
				p.children = make(map[canceler]struct{})
			}
			p.children[child] = struct{}{}
		}
		p.mu.Unlock()
	} else {
        // 如果没有cancel类型的父ctx，那就通过监听当前parent ctx的cancel，来cancel自身。
        // 仅当parent时valueCtx类型的且祖先中没有cancelable时候，会执行到这里，这时候parent的done方法永远不会返回，因为是nil。
		go func() {
			select {
			case <-parent.Done():
				child.cancel(false, parent.Err())
			case <-child.Done():
			}
		}()
	}
}
```

cancel方法：

```go
func (c *cancelCtx) cancel(removeFromParent bool, err error) {
	if err == nil {
		panic("context: internal error: missing cancel error")
	}
	c.mu.Lock()
	if c.err != nil {
		c.mu.Unlock()
		return // already canceled
	}
	c.err = err
	if c.done == nil {
		c.done = closedchan
	} else {
        // cancel 的本质是把管道close掉。
        // 当chan被close，所有因该chan产生的阻塞会被放开。
		close(c.done)
	}
    // 下面的都子ctx 都cancel掉
	for child := range c.children {
		// NOTE: acquiring the child's lock while holding parent's lock.
		child.cancel(false, err)
	}
	c.children = nil
	c.mu.Unlock()

	if removeFromParent {
		removeChild(c.Context, c)
	}
}
```

done方法：

```go
func (c *cancelCtx) Done() <-chan struct{} {
	c.mu.Lock()
	if c.done == nil {
		c.done = make(chan struct{})
	}
	d := c.done
	c.mu.Unlock()
	return d
}
```

WithValue：

```go
func WithValue(parent Context, key, val interface{}) Context {
	if key == nil {
		panic("nil key")
	}
	if !reflect.TypeOf(key).Comparable() {
		panic("key is not comparable")
	}
    // parent的混入，方法自动继承，所以如果他的父元素是cancel，父元素的cancel也会作用于它的done方法，因为本质是继承了。
	return &valueCtx{parent, key, val}
}

// A valueCtx carries a key-value pair. It implements Value for that key and
// delegates all other calls to the embedded Context.
type valueCtx struct {
	Context
	key, val interface{}
}

func (c *valueCtx) String() string {
	return fmt.Sprintf("%v.WithValue(%#v, %#v)", c.Context, c.key, c.val)
}

func (c *valueCtx) Value(key interface{}) interface{} {
	if c.key == key {
		return c.val
	}
	return c.Context.Value(key)
}

```

```timer 类型的ctx 继承了cancel类型的，也是用混入做继承。
func WithDeadline(parent Context, deadline time.Time) (Context, CancelFunc) {
	if cur, ok := parent.Deadline(); ok && cur.Before(deadline) {
		// The current deadline is already sooner than the new one.
		return WithCancel(parent)
	}
	c := &timerCtx{
		cancelCtx: newCancelCtx(parent),
		deadline:  deadline,
	}
	propagateCancel(parent, c)
	d := time.Until(deadline)
	if d <= 0 {
		c.cancel(true, DeadlineExceeded) // deadline has already passed
		return c, func() { c.cancel(true, Canceled) }
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.err == nil {
		c.timer = time.AfterFunc(d, func() {
			c.cancel(true, DeadlineExceeded)
		})
	}
	return c, func() { c.cancel(true, Canceled) }
}
```
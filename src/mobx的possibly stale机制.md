### TL;DR

- mobx的computed value通过扩散POSSIBLY_STALE状态减少不必要的reaction调度。
- reaction尽可能只依赖computed value。

### mobx的STALE状态扩散

在一个action内，observable接收到新值后，会使用propagateChanged把STALE状态扩散到它的依赖，这个过程是个深度优先遍历。

```js
export function propagateChanged(observable: IObservable) {
    if (observable.lowestObserverState === IDerivationState.STALE) return
    observable.lowestObserverState = IDerivationState.STALE

    observable.observers.forEach(d => {
        if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
            if (d.isTracing !== TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
            d.onBecomeStale()
        }
        d.dependenciesState = IDerivationState.STALE
    })
}
```

在`d.onBecomeStale()`中，有两种情况：

1. d是一个reaction
2. d是一个computed value

当d是reaction时，mobx会直接把reaction放入调度队列。当d是computed value时，情况有所不同，它会继续扩散撞他，只不过使用的状态扩散方法为`propagateMaybeChanged`：


```js
export function propagateMaybeChanged(observable: IObservable) {
    if (observable.lowestObserverState !== IDerivationState.UP_TO_DATE) return
    observable.lowestObserverState = IDerivationState.POSSIBLY_STALE

    observable.observers.forEach(d => {
        if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
            d.dependenciesState = IDerivationState.POSSIBLY_STALE
            if (d.isTracing !== TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
            d.onBecomeStale()
        }
    })
}
```

当然，最终到reaction的时候也会调用`this.schedule()`，也是被加入到调度队列的状态，当状态扩散完毕，到了执行阶段`POSSIBLY_STALE`开始发挥它的作用了：

```js
runReaction() {
    if (!this.isDisposed) {
        startBatch()
        this._isScheduled = false
        if (shouldCompute(this)) {
            this._isTrackPending = true

            try {
                this.onInvalidate()
                if (this._isTrackPending && isSpyEnabled()) {
                    // onInvalidate didn't trigger track right away..
                    spyReport({
                        name: this.name,
                        type: "scheduled-reaction"
                    })
                }
            } catch (e) {
                this.reportExceptionInDerivation(e)
            }
        }
        endBatch()
    }
}
```

`this.onInvalidate()`是执行我们定义的reaction回调函数，在`shouldCompute`中，有一些事情把reaction的执行拦截：

```js
export function shouldCompute(derivation: IDerivation): boolean {
    switch (derivation.dependenciesState) {
        case IDerivationState.UP_TO_DATE:
            return false
        case IDerivationState.NOT_TRACKING:
        case IDerivationState.STALE:
            return true
        case IDerivationState.POSSIBLY_STALE: {
            const prevAllowStateReads = allowStateReadsStart(true)
            const prevUntracked = untrackedStart()
            const obs = derivation.observing,
                l = obs.length
            for (let i = 0; i < l; i++) {
                const obj = obs[i]
                if (isComputedValue(obj)) {
                    if (globalState.disableErrorBoundaries) {
                        obj.get()
                    } else {
                        try {
                            obj.get()
                        } catch (e) {
                            untrackedEnd(prevUntracked)
                            allowStateReadsEnd(prevAllowStateReads)
                            return true
                        }
                    }
                    if ((derivation.dependenciesState as any) === IDerivationState.STALE) {
                        untrackedEnd(prevUntracked)
                        allowStateReadsEnd(prevAllowStateReads)
                        return true
                    }
                }
            }
            changeDependenciesStateTo0(derivation)
            untrackedEnd(prevUntracked)
            allowStateReadsEnd(prevAllowStateReads)
            return false
        }
    }
}
```

如果reaction的状态是`POSSIBLY_STALE`，需要提前对所依赖的computed value求值，在get()中：

1, 如果当前computed也是POSSIBLY_STALE，需要通过shouldCompute判断它本身是否需要被重新计算
2, 如果当前computed需要被重新计算，需要判断新旧值是否相等
3, 如果不相等，则通过propagateChangeConfirmed把**整个依赖下游的POSSIBLY_STALE转成STALE**

```js
if (shouldCompute(this)) if (this.trackAndCompute()) propagateChangeConfirmed(this)
const oldValue = this.value
const newValue = this.computeValue(true)
```

执行完之后如果当前reaction被设置成了STALE，则shouldComputed返回true，接着reaction被执行。如果没变STALE则执行可以省略。



### 实际case

----------- 1 -----------

c求值了两次，reaction执行一次。在后续的action中，未使c的状态发生变化，reaction的状态未变为STALE，第二次不执行。

```js
import { observable, computed, decorate, autorun, runInAction } from 'mobx'

const obj = decorate({
    a: 0,
    b: 0,
    get c() {
        console.log('---- evaluate c ----')
        console.log('a:', this.a)
        console.log('b:', this.b)
        return this.a + this.b
    }
}, {
    a: observable,
    b: observable,
    c: computed,
})

autorun(() => {
    console.log('---- run reaction ----')
    console.log('c:', obj.c)
})

runInAction(() => {
    obj.a = 1
    obj.b = -1
})

```

----------- 2 -----------

```js
import { observable, computed, decorate, autorun, runInAction } from 'mobx'

const obj = decorate({
    _a: 1,
    _b: 1,
    get a() {
        console.log('evaluate a')
        return this._a + 1
    },
    get b() {
        console.log('evaluate b')
        return this._a + this._b
    }
}, {
    _a: observable,
    _b: observable,
    a: computed,
    b: computed,
})

autorun(() => {
    console.log('reaction start')
    console.log(obj.a, obj.b)
})

runInAction(() => {
    obj._a = 2
    obj._b = 0
})
```

打印结果为

```js
reaction start
evaluate a
evaluate b
2 2
evaluate a
reaction start
evaluate b
3 2
```

在action过程中，reaction执行之前状态是POSSIBLY_STALE，对其依赖求值，检测到a发生变化并将reaction的状态变成STALE，开始执行reaction，此时a走缓存，b求值。可见这个求值顺序也是不定的，所以让computed value保持pure吧。

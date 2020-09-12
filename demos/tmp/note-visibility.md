## 背景

新的周报系统希望：

- 默认全部可见
- 团队可以手动设置白名单人员和团队
- 人员可以基于团队设置的白名单人员和团队

与原方案不同的点：

- 可以设置人以及team。原周报系统默认不可见，如果开放权限需要设置“可见人员列表”
- team之间有层级关系。原周报系统team之间的
- 从个人的角度，可以通过组织树自己的权限范围

## 分析方法

关键理念：

- 相对于性能的极致，更偏向于业务逻辑的极度清晰。
- 解决方案往“人”上面靠，淡化甚至消除team的概念。先阶段系统的使用场景还是从人的角度出发，我们最终要求的是人对人的可见性（至于如果需要从界面中体现人对team的可见性，仅仅通过前端判断team下的人是否全部不可见即可）。
- 明确Team的范围。通过团队管理可以管理目标团队的一个可见团队列表，比如TeamA的可见团队是TeamB，TeamA/B分别包含哪些人？主要的区别在于是否递归，如果我们把这个算法抽离出来分析，是否递归也只是一个算法的开关。然而这一切还是会回归到**人**上面。

## 详细分析

### 引入人员可见性白名单字典

Team的范围算法记为`Scope`，那TeamA下面的所有人就是`Scope(A)`，如果TeamA设置的可见性为`TeamA <= union(TeamA, TeamB, Stuff1)`，那么从人的角度，整个可见性可记做`Scope(A) <= union(Scope(A), Scope(B), Stuff1)`，那情况可能是：

```js
const targetStuffs = ['StuffA1', 'StuffA2']
const visibleStuffs = ['StuffA1', 'StuffA2', 'StuffB1', 'StuffB2', 'Stuff1']
visibleStuffs.hasPermissionToView(targetStuffs)
```

那么可以分别得到员工`StuffA1`和`StuffA2`的**可见性白名单字典**

```js
const whiteListA1 = {
    'StuffA1': true,
    'StuffA2': true,
    'StuffB1': true,
    'StuffB2': true,
    'Stuff1': true
}
const whiteListA2 = {
    'StuffA1': true,
    'StuffA2': true,
    'StuffB1': true,
    'StuffB2': true,
    'Stuff1': true
}
```

这里明确一下影响的范围，实际上的影响范围不在上面提到的任何Stuff，而是在于未在`visibleStuffs`这个列表里的人。**也就是说，一旦这个人存在“可见性白名单字典”，那么他就有可能被某些人不可见**，相当合理。那么从默认全局可见的角度，可以把一个员工的**默认可见性白名单字典**字段记为全员。现在从人的角度具体分析。

### 计算人员可见范围

**Stuff1:**

Stuff1初始可见范围是全体员工，遍历所有的同事去排除他不可见的同事。如果这个同事没有**可见性白名单字典**则使用**默认可见性白名单字典**，到了A1和A2，他们存在白名单且含有Stuff1，则还是可见不用做处理。

**StuffSomeone:**

前面都一样，到了A1和A2，**他们存在白名单且白名单中没有StuffSomeone，则将A1和A2从StuffSomeone的可见范围中删除**。


### 最终可见性字典

- 支持单独配置人员可见性
- 每个人可能在多个team

设想一个场景StaffA1想让StuffSomeone看到自己的周报，StaffA1自己个人周报可见人为`['StuffSomeone']`，那么这个配置也会生成一个可见性字典，所以StaffA1有下面两个可见性字典：

```js
const whiteListA11 = {
    'StuffA1': true,
    'StuffA2': true,
    'StuffB1': true,
    'StuffB2': true,
    'Stuff1': true
}
const whiteListA12 = {
    'StuffSomeone': true,
}
```

最终的可见性字典：

```js
const whiteListA1Final = {
    'StuffA1': true,
    'StuffA2': true,
    'StuffB1': true,
    'StuffB2': true,
    'Stuff1': true,
    'StuffSomeone': true,
}
```

那么StuffSomeone的case就变成了，A1可见，A2还是不可见。

同理因为A1可能不止在TeamA，假设A1还在TeamAnother，且TeamAnother的可见人设置为`['StuffSomeone']`，也可以达到上面的效果，所以：

```js
const whiteListA1Final = union(whiteListA11, whiteListA12, ...whiteListA1Rest)
```

### 配置的影响面

A1被哪些团队的可见性配置影响？这取决于`Scope`算法的具体实现，实际上就是**Scope算法运行结果的反查**。问题就在于`Scope`是递归还是非递归。

## 研发建议

用伪代码描述一下这个算法，再分析一下复杂度：

```js
const stuffs = ['a', 'b', ...]    // 所有成员
const teams = [...]               // 所有团队
const currentUser = 'x'           // 当前登录用户
const currentUserVisibles = {...} // 当前用户可见性，初始值是全体员工

for (const stuff of stuffs) {
    // 拿到当前人自己设置的白名单
    const whiteListDictHimself = getWhiteListDictOfStuff(stuff)
    const whiteLists = whiteListDictHimself ? [ whiteListDictHimself ] : []

    for (const team of teams) {
        // Scope然后反查，跳过不包含这个用户的team
        const teamScopedUsers = Scope(team)
        if (!teamScopedUsers.contain(stuff)) {
            continue
        }

        const currentTeamWhiteListOfStuff = whiteListDictsOfTeam(team)[stuff]
        currentTeamWhiteListOfStuff && whiteLists.push(currentTeamWhiteListOfStuff)
    }

    // 如果没有任何设置命中他，则使用默认白名单列表，目前是全体员工
    const currentStuffFinalWhitelist = whiteLists.isEmpty() ? getDefaultWhiteList(stuff) : unionAllWhiteList(whiteLists)

    // 如果可见列表中不包含当前用户，移除
    if (!currentStuffFinalWhitelist[currentUser]) {
        delete currentUserVisibles[stuff]
    }
}

return currentUserVisibles
```

如果n是员工总数，算单个员工的复杂度，整体复杂度规模在`O(n^2)`到`O(n^3)`，如果在线会影响体验，离线压力应该不大，如果离线压力大可以考虑拆解到离线和在线两个部分去运行。

好处：

- Scope抽象出来，后续递归还是非递归逻辑可以灵活应对
- getDefaultWhiteList抽象出来，后续如果默认团队内可见也可以做
---
date: 2019-10-22
tags: javascript
---

> 最近遇到太多“半受控”的case了，所以在React官方文档中搜索了一番，确实[给了些建议](https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#preferred-solutions)。

一般来说对于非受控组件，内部初始化的时候都会同步props的值到state，不过后续便不受props的影响，对于受控组件则相反。而实际开发的过程中常常需要在update生命周期中，根据外部的props更新内部的state，很容易[写出反模式](https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#preferred-solutions)。虽然也并不是啥难解决的是，不过还是看看[官方的建议](https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#preferred-solutions)。

### 1. 用key

比较简单，一个非受控组件：

```js
class EmailInput extends Component {
  state = { email: this.props.defaultEmail };

  handleChange = event => {
    this.setState({ email: event.target.value });
  };

  render() {
    return <input onChange={this.handleChange} value={this.state.email} />;
  }
}
```

上层使用时，当id改变时刷新非受控组件：

```js
<EmailInput
  defaultEmail={this.props.user.email}
  key={this.props.user.id}
/>
```

> 原以为这是反模式...不过性能会稍微差一点。

### 2. 有条件的更新state

反模式是无条件的，那么有条件的就可控了。当`props.userID`更新，更新`state.email`：

```js
class EmailInput extends Component {
  state = {
    email: this.props.defaultEmail,
    prevPropsUserID: this.props.userID
  };

  static getDerivedStateFromProps(props, state) {
    // Any time the current user changes,
    // Reset any parts of state that are tied to that user.
    // In this simple example, that's just the email.
    if (props.userID !== state.prevPropsUserID) {
      return {
        prevPropsUserID: props.userID,
        email: props.defaultEmail
      };
    }
    return null;
  }

  // ...
}
```

### 3. 外部指令更新

内部定义更新方法：

```js
class EmailInput extends Component {
  state = {
    email: this.props.defaultEmail
  };

  resetEmailForNewUser(newEmail) {
    this.setState({ email: newEmail });
  }

  // ...
}
```

外部使用ref拿到class instance，适时调用instance更新方法：

```js
  handleChange = index => {
    this.setState({ selectedIndex: index }, () => {
      const selectedAccount = this.props.accounts[index];
      this.inputRef.current.resetEmailForNewUser(selectedAccount.email);
    });
  };
```

### FunctionComponent?

对于方案1，方案2，依然适用。方案3就不行了。方案2大概就是：

```ts
export const EmailInput: React.FC<{ userId: string, email: string }> = (props) => {
    const [ email, setEmail ] = useState(props.email)
    useEffect(() => {
        setEmail(props.email)
    }, [ props.userId ])
    return (
        <label>
            Email: <input onChange={e => {
                setEmail(e.target.value)
            }} value={email} />
        </label>
    );
}
```

所以hooks还是香。
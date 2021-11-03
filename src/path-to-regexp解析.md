---
date: 2021-11-03
tags: nodejs
---

### 从最小实现中看基本原理

这不是我自己写的，是花了一点点时间从源码中提取的，以方便自己理解。保留了最基本的参数功能，运行过程如下：

```js
const { pathToRegexp } = require('./mini-path2reg');
const routeDef = '/user/:id/:page'
const params = []
const regExp = pathToRegexp(routeDef, params)
console.log(params)
/*
在准备阶段，可以获得path里包含哪些参数
[
  {
    name: 'id',
    prefix: '/',
    suffix: '',
    pattern: '[^\\/#\\?]+?',
    modifier: ''
  },
  {
    name: 'page',
    prefix: '/',
    suffix: '',
    pattern: '[^\\/#\\?]+?',
    modifier: ''
  }
]
*/

const reqPath = '/user/1/home'
console.log(regExp.exec(reqPath))
/*
在运行时，可以检查reqPath是否匹配，并且可以把参数值从reqPath提取出来
是按顺序添加的
[
  '/user/1/home',
  '1',
  'home',
  index: 0,
  input: '/user/1/home',
  groups: undefined
]
*/
```

基本过程：

- lexer
- parser
- pathToRegexp（拼接

剥离出来的基本代码&注释：

```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToRegexp = void 0;

function lexer(str) {
    var tokens = [];
    var i = 0;
    // 逐字判断
    while (i < str.length) {
        var char = str[i];
        // LEXER MODIFIER
        if (char === ":") {
            // 如果是“:”，可能是一个参数
            var name = "";
            var j = i + 1;
            // 逐字累加参数，直到不是数字字母下划线为止
            while (j < str.length) {
                var code = str.charCodeAt(j);
                if (
                // `0-9`
                (code >= 48 && code <= 57) ||
                    // `A-Z`
                    (code >= 65 && code <= 90) ||
                    // `a-z`
                    (code >= 97 && code <= 122) ||
                    // `_`
                    code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            // 如果“:”后面没有跟任何参数，认为书写错误
            if (!name)
                throw new TypeError("Missing parameter name at " + i);
              
            // 作为一个NAME类型存入tokens
            tokens.push({ type: "NAME", index: i, value: name });
            i = j;
            continue;
        }
        // LEXER PATTERN
        // 默认都以CHAR类型存入tokens
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    // 标识结尾
    tokens.push({ type: "END", index: i, value: "" });
    // '/user/:id/:page'最终获得tokens
    // [
    //   { type: 'CHAR', index: 0, value: '/' },
    //   { type: 'CHAR', index: 1, value: 'u' },
    //   { type: 'CHAR', index: 2, value: 's' },
    //   { type: 'CHAR', index: 3, value: 'e' },
    //   { type: 'CHAR', index: 4, value: 'r' },
    //   { type: 'CHAR', index: 5, value: '/' },
    //   { type: 'NAME', index: 6, value: 'id' },
    //   { type: 'CHAR', index: 9, value: '/' },
    //   { type: 'NAME', index: 10, value: 'page' },
    //   { type: 'END', index: 15, value: '' }
    // ]
    return tokens;
}
/**
 * Parse a string for the raw tokens.
 */
function parse(str, options) {
    if (options === void 0) { options = {}; }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    // 对于一个未规定格式参数的默认格式，即非/#?其他字符
    var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
    var result = [];
    var i = 0;
    var path = "";
    // 消费方法，尝试消费，如果消费失败，原地不懂
    var tryConsume = function (type) {
        if (i < tokens.length && tokens[i].type === type)
            return tokens[i++].value;
    };
    // 消费方法，消费失败报错
    var mustConsume = function (type) {
        var value = tryConsume(type);
        if (value !== undefined)
            return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
    };
    while (i < tokens.length) {
        // PARSE PARAM START
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");

        if (name) {
            // 尝试拿一个prefix（这个prefix的具体用途后续说。为什么要同时消费char和name，也主要是为了拿prefix
            var prefix = char || "";
            // 如果char不在这个列表里（“.”或者“/”）
            // prefix清空
            // 累加到path
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            // flush，清算NAME类型之前累加char
            if (path) {
                result.push(path);
                path = "";
            }
            // 收集到结果
            result.push({
                name: name,
                prefix: prefix,
                suffix: "",
                pattern: defaultPattern,
                modifier: ""
            });
            continue;
        }
        // PARSE PARAM END

        // 累加到path
        var value = char
        if (value) {
            path += value;
            continue;
        }
        // 啥玩意没有了，最后必然剩一个END
        mustConsume("END");
    }
    /*
    // 最后拿到了一个这
    [
      '/user',
      {
        name: 'id',
        prefix: '/',
        suffix: '',
        pattern: '[^\\/#\\?]+?',
        modifier: ''
      },
      {
        name: 'page',
        prefix: '/',
        suffix: '',
        pattern: '[^\\/#\\?]+?',
        modifier: ''
      }
    ]
    */
    return result;
}
exports.parse = parse;

function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}

function pathToRegexp(path, keys, options) {
    return tokensToRegexp(
      parse(path, options), 
      keys, 
      options
    );
}

function tokensToRegexp(tokens, keys, options) {
    console.log('parsed tokens:', tokens)
    options = options || {}
    var route = "^"; // 匹配开始（在实际lib中，可以在option中配置
    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (typeof token === "string") {
            // 如果是一个string，比如我们例子中的第一段
            // 直接累加，然后继续
            route += escapeString(token);
        }
        else {
            var prefix = escapeString(token.prefix);
            var suffix = escapeString(token.suffix);
            if (token.pattern) {
                // 参数类型，如果有外部传来的keys，进行参数收集
                if (keys)
                    keys.push(token);
                // 是否有前缀后缀，在我的例子里存在一个prefox，所以这里我们走的是这个分支
                // 这里区分prefix和suffix的case是因为需要把prefix suffix和pattern一起放进来作为一个组
                if (prefix || suffix) {
                    route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")";
                }
                else {
                    // 这个分支也比较好理解，就是去掉了外面的不可捕获组
                    route += "(" + token.pattern + ")";
                }
            }
            // 暂时没走这个分支
            else {
                route += "(?:" + prefix + suffix + ")";
            }
        }
    }
    // 匹配结尾（在实际lib中，可以在option中配置end以及是否严格模式（trailingslash case
    route += "$"
    return new RegExp(route, 'i'); // 生成regExp对象（在实际lib中，可以设置是否case sensitive
}
exports.tokensToRegexp = tokensToRegexp;
exports.pathToRegexp = pathToRegexp;
```

### 加入pattern

除了参数功能，也可以给参数设定格式，方式是用一段正则，如下

```js
// 规定id是一个数字
const routeDef = '/user/:id(\\d+)/:page'
// 也可以不指定参数名，这时参数name为0
const routeDef2 = '/user/(\\d+)/:page'
```

实现pattern需要加一些代码，在lexer处：

```js
      // 在上面的LEXER PATTERN处插入下面代码
      if (char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at " + j);
            }
            while (j < str.length) {
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                }
                else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        // 不允许存在组
                        throw new TypeError("Capturing groups are not allowed at " + j);
                    }
                }
                pattern += str[j++];
            }
            // 括号没有闭合，语法错误
            if (count)
                throw new TypeError("Unbalanced pattern at " + i);
            // 空的括号，语法错误
            if (!pattern)
                throw new TypeError("Missing pattern at " + i);
            tokens.push({ type: "PATTERN", index: i, value: pattern });
            i = j;
            continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
```

因为上面的代码实际上是在参数解析部分后面的，也正好符合上面提到的两种case：

1. 参数 + pattern
2. 仅pattern

同时在parser中，也对PATTERN类型的token有处理：

```js
        // 将上面 "PARSE PARAM START"与"PARSE PARAM END"之间的代码替换
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++, // 如果没有name，用一个递增的key作为name
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern, // 如果没有pattern，再用默认pattern
                modifier: tryConsume("MODIFIER") || "" // modifier，必须跟在参数最后，下面详细说
            });
            continue;
        }

```

不难发现，这里实现参数功能NAME，PATTERN存在其一即可，CHAR则可选。且pattern对实际拼接过程不构成影响。

### 加入modifier

关于modifier的使用这里不多嘴，参考 https://github.com/pillarjs/path-to-regexp#modifiers。modifier必须跟在NAME或者PATTERN的后面，如果放到错误的位置会报错。

```js
        // 在上面的LEXER MODIFIER处插入下面代码
        if (char === "*" || char === "+" || char === "?") {
            tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
            continue;
        }
```

在parser阶段，MODIFIER的消费都是恰好在result.push一个参数之前，其实也就是相当于紧跟url参数。影响比较大的是拼接阶段：

```js
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (typeof token === "string") {
            route += escapeString(encode(token));
        }
        else {
            var prefix = escapeString(encode(token.prefix));
            var suffix = escapeString(encode(token.suffix));
            if (token.pattern) {
                if (keys)
                    keys.push(token);
                if (prefix || suffix) {
                    if (token.modifier === "+" || token.modifier === "*") {
                        var mod = token.modifier === "*" ? "?" : "";
                        route += "(?:" + 
                            prefix + 
                                "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + 
                            suffix + 
                        ")" + mod;
                    }
                    else {
                        route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
                    }
                }
                else {
                    route += "(" + token.pattern + ")" + token.modifier;
                }
            }
            else {
                route += "(?:" + prefix + suffix + ")" + token.modifier;
            }
        }
    }
```

先说"?"，这个比较好理解，其实急救室在原本的后面追加了一下，值得注意的是，为了避免不必要的理解成本，可选参数要放在最后，如下：

```js
const routeDef = '/user/:id?/:page'
const reqPath = '/user/1'
// 匹配到的结果是[ undefined, '1' ]，最终拿到 { page: '1' }
// 也合理，不过容易让人误解

// 这里也解释了为什么要把prefix也加到组里，是为了把prefix+pattern整个作为整体，但也是path这种场景所限制的
```

再看看"+"和"*"，看`token.modifier === "+" || token.modifier === "*"`这个分支。这里乍一看太懵逼，直接举例看结果：

```js
const routeDef = '/user/:id(\\d)+/:page'
const params = []
const regExp = pathToRegexp(routeDef, params)
// /^\/user(?:\/((?:\d)(?:\/(?:\d))*))(?:\/([^\/#\?]+?))[\/#\?]?$/i
const reqPath = '/user/1/1/1/home'
console.log(regExp, params)
// 匹配到 [ '1/1/1', 'home' ]，最终拿到 { id: '1/1/1', page: 'home' } 
```

对于“*”生成的正则

```js
const routeDef = '/user/:id(\\d)*/:page'
const regExp = pathToRegexp(routeDef, params)
// /^\/user(?:\/((?:\d)(?:\/(?:\d))*))?(?:\/([^\/#\?]+?))[\/#\?]?$/i
```

关于上面两大串正则表达式，建议使用https://regex101.com/解析，就非常清晰了。注意“+”“*”的匹配方式是greedy的，如下：

```js
const routeDef = '/user/:id(\\d)+/:page+'
const reqPath = '/user/1/1/ho/me'
// 结果： { id: '1/1', page: 'ho/me' } [ '1/1', 'ho/me' ]

const routeDef = '/user/:id+/:page+'
const reqPath = '/user/1/1/1/home'
// 结果： { id: '1/1/1', page: 'home' } [ '1/1/1', 'home' ]
```

这种用法给我的感受并不好，徒然增加理解成本，不知所谓。
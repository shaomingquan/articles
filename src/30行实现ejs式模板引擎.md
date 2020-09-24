---
date: 2016-08-20
tags: javascript
---

大半夜的比较精神。如何实现一个简单的EJS模板语言？我尝试不去搜索任何资料，脑补之。一个核心功能必然是输入一个模板，一组数据，生成一段文字。然后定一个自己的pattern，写出实现，然后run。前置知识：模板知识，javascript。

提到EJS的实现我首先想到eval，EJS的输入中含有javascript，而eval恰好可以使用内核调用javascript。本文实现`<% %>`和`<%- %>`，前者写js，后者控制输出。

本文将实现render函数使得下面的部分可以实现字符串常规输出与逻辑输出。
```js
var data = {
    list: [1,2,3]
};
var tpl = `
    <div>
        <span><%- list[1] %></span>
        <% for(var i = 0; i < 3; i++) { %>
            <% if(i == 1) { %>
                <span><%- list[i] %></span>
            <% } %>
        <% } %>
    </div>
`;
console.log(render(tpl, data)); //output
```

### 实现
先贴代码吧。简单实现了一个类EJS模板引擎，正好30行。下面说思想。
```js
var render = function (tpl, data) {
    var vars = Object.keys(data);
    for(var i = 0; i < vars.length ;i++) {
        eval(`var ${vars[i]} = ${JSON.stringify(data[vars[i]])}`);
    }
    var finalOutArr = [];
    var tempArr = [];
    var index = 0;
    while(true) {
        index = tpl.indexOf('<%');
        if(index === -1) {
            tempArr.push(`finalOutArr.push(\`${tpl}\`)`);
            break;
        }
        tempArr.push(`finalOutArr.push(\`${tpl.substring(0, index).replace(/\n/g, '')}\`)`);
        tpl = tpl.substring(index);
        index = tpl.indexOf('%>');
        if(tpl[2] === '-') {
            tempArr.push(`finalOutArr.push(eval('${tpl.substring(3, index).replace(/\n/g, '')}'))`);
        } else {
            tempArr.push(tpl.substring(2, index));
        }
        tpl = tpl.substring(index + 2);
    }
    try {
        eval(tempArr.join('\n'));
    } catch (e) {
        console.error(e);
    }
    return finalOutArr.join('\n')
};
```
首先在最开始将data里面的key作为变量名，value作为值，通过eval输出到当前作用域中。切割模板，识别各个部分的类型：普通文字（不被`%`包裹），输出文字（被`<%-  %>`包裹），控制逻辑（被`<%  %>`包裹）。顺序解析并切割。`finalOutArr`用来存储一个结果数组，一个逻辑栈`tempArr`，用来存储逻辑。***解析的过程以生成往结果数组录入结果的代码***。如果解析出普通文字，代码为直接入结果栈，如果解析到`<%-  %>`，需要eval帮助读变量。如果解析出控制逻辑，直接入逻辑栈。最终将逻辑栈的代码串联起来，有了下面的代码就清楚地知道`render`做了什么了。
```
for(var i = 0; i < 3; i++) { 
    finalOutArr.push('            ')
    if(i == 1) { 
        finalOutArr.push('                <span>')
        finalOutArr.push(eval(' list[i] '))
        finalOutArr.push('</span>            ')
    } 
    finalOutArr.push('        ')
}
```
最后把结果栈的东西join起来就ok了。
上面的方案对于错误处理比较友好，eval出错可以直接catch到，然后作为提示信息展示给用户。

不过照比ejs慢了些。。

### 优化
仅使用一次eval，并且只是用字符串。
```js
var render = function (tpl, data) {
        var vars = Object.keys(data);
        var varEvalList = '';
        for(var i = 0; i < vars.length ;i++) {
            varEvalList += `var ${vars[i]} = ${JSON.stringify(data[vars[i]])};`;
        }
        var output = ''; // may be uglify bug
        var code = '';
        var index = 0;
        while(true) {
            index = tpl.indexOf('<%');
            if(index === -1) {
                code += `output += \`${tpl}\`;`;
                break;
            }
            code += `output += \`${tpl.substring(0, index)}\`;`;
            tpl = tpl.substring(index);
            index = tpl.indexOf('%>');
            if(tpl[2] === '-') {
                code += `output += ${tpl.substring(3, index)};`;
            } else {
                code += tpl.substring(2, index) + '\n';
            }
            tpl = tpl.substring(index + 2);
        }
        try {
            console.log(varEvalList + code);
            eval(varEvalList + code);
        } catch (e) { console.error(e); }
        return output;
    };
```
现在比ejs快了近七倍。看来提速不能光看方案，需要从自己代码质量入手。。发了个小包 https://www.npmjs.com/package/waterbear
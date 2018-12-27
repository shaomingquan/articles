***why?***

源于一个自驱动项目。为了解决一些通用可视化的问题，考虑到原需求存在以下情况：
- 中间指标计算的情况，比如c指标是通过f(a,b)生成。
- 有原值和平均值对比的情况，需要求sum(y)/count(y)。
- 使用一个指标释出两条线。

用法大概是这样。

- `["$0_sum / $0_count", "$0"]` 平均值跟每一天的对比。
- `["60*(1-$1)"]` 生成一个计算后的更直观的新指标。
- ...

***resolve***

所以需要一个简单的dsl去描述这类问题。整体来讲有两步。
- 构建待注入的全局对象。
- 为一组将要计算的值注入相应的值。
- 安全的eval表达式。

***code***

因为实际项目中存在较多边界情况，所以我只列思路。如下代码及注释：


```js
import mathjs from 'mathjs';

let serie1 = [{x:1, y:2}, {x:1, y:3}, {x:1, y:4}];
let serie2 = [{x:1, y:3}, {x:1, y:4}, {x:1, y:5}];
series = [serie1, serie2];

function getSum(serie) {} // return serie sum val

function getCount(serie) {} // return serie sum count

function chartDSL (series, expressions) {
  let scope = {}; // 命名空间
  let sCount = series.length;

  for(let i = 0 ; i < sCount ; i ++) { 
  // 算一些特殊值
  // $1_sum 表示第一个serie的y值总和。count一样
    scope[`$${i}_sum`]=sum(series[i]);
    scope[`$${i}_count`]=sum(series[i]);
  }

  return expressions.map(exp => {
    let ret = deepCopy(series[0]);
    let sLength = ret.length;
    for(let i = 0 ; i < sLength ; i ++) {
      for(let j = 0 ; j < sCount ; j ++) {
        scope[`$${j}`]=series[j][i].y; 
        // $0,$1... 表示每个将要参与计算的值
      }
      ret[i].y = mathjs.eval(exp, scope); // 安全的eval
    }
    return ret;
  })
}
```

***keyPoints***

- 保证eval调用不执行用户输入的内容。
- 特殊值提前声明，通用值单独声明。
- mathjs提供一种针对表达式的安全eval，可以应对用户输入部分。

***problems***

- mathjs包不小，有100多k。

但其实mathjs包提供了不少功能，可以指引用户自行拓展功能。

***吐槽***

因为目前的统计项目的特点是面向**复杂的高维组合**提供数据采集，整个查询工具考虑到维度之间的联动踩了不少的坑，以及生成主题，主题预览上线等功能，好几次修改代码之后总算还差一点就看起来比较稳定（节后修复那一点），好在已经可以用它解决一些客服问题了（直接上图，挺酷的）。

今天的简易DSL算这个子项目唯一比较有意思的东西了。心累。
从过年到现在的这段时间，趁着过节无聊和过节后的工作之余，没事刷刷leetcode（use javascript）。顺序是Acceptance降续。目前已经刷了200道题了，正值Q末，所以做个总结。

### 小小的感想

- javascript跟c++比简直弱爆了，一般来讲慢十倍左右。
- javascript边界条件处理的代码较静态语言要少。
- leetcode中使用javascript的用户不多，可见js不适合做算法，且前端往往不关心算法（很大程度上也不必关心），js的性能损耗往往在于语言的用法（而不是具体算法）。但毕竟js终究传达了算法的核心思想，这脱离了语言这一层。
- easy may be more difficult，其实主要还是看Acceptance这个指标，越大越简单。但leetcode的Acceptance降续是以difficulty为优先维度的，也有他的合理性。
- 大部分题总结不出具体的**方法论**，或许有方法论支持的题营养价值更高，不过大部分的实际场景应该是没有套路的。
- 首先切到solutions Tab，大概查看一下高分答案的时间复杂度，在做题之前做到心中有数。
- console会浪费时间，当Failed的时候首要检查console是否删掉。
- 每次提交Accepted之后的耗时可能不同，但很多次都在很低的百分比，那可能是代码有些问题。
- 当题目条件带有某种特征，最常见的是sorted array，那么九成九需利用这个特征去降低时间复杂度。
- 刷一遍和仔细刷一般的成本是指数级的区别。学习不在于刷了多少题，在于get到了多少思想。自觉仍有很多的点需要get，第一遍刷还是有些水。待二周目的时候还是有价值在看。
- Python经常可以实现十行之内的解法，这极大的提升了我对它的兴趣。

### 正题

提到**方法论**leetcode中的不少题也是方法论的很好的实践。在200题之内的初级阶段，基本上是一些比较简单的概念。

对于方法论的使用，我觉得原则是这样的，首要的用***数学知识，其次用非递归方法并考虑是否可以用位运算加速，递归则应该放到最后***。

##### 直接上数学
例1：https://leetcode.com/problems/missing-number/#/description
连续数字少了一个则立马联想到如果没少那么和是多少，这个很容易求，再减去每一项就可得出少的哪一个。实际上这题也有点逆向思维的意思。
```js
var missingNumber = function(nums) {
    var n = nums.length;
    var all = n * (n + 1) / 2;
    return nums.reduce((result, current) => {
        return result - current;
    }, all);
};
```
例2：https://leetcode.com/problems/power-of-three/#/description
`3 ^ 19`能整除n的话，n必须满足`n === 3 ^ x`，x是整数。
```js
var isPowerOfThree = function(n) {
    return ( n > 0 && 1162261467 % n === 0);
};
```
类似的：
- https://leetcode.com/problems/valid-perfect-square/#/description
- 组合数（注意不要算C7,6，要算C7,1） [https://leetcode.com/problems/unique-paths/#/description](https://leetcode.com/problems/unique-paths/#/description)
- [牛顿迭代法](http://baike.baidu.com/item/%E7%89%9B%E9%A1%BF%E8%BF%AD%E4%BB%A3%E6%B3%95) https://leetcode.com/problems/sqrtx/
- https://leetcode.com/problems/nim-game/#/description
- 3 \* 3 > 2 \* 2 \* 2  https://leetcode.com/problems/integer-break/#/description
- https://leetcode.com/problems/gray-code/#/description

##### 存储置换速度
**1,缓存型置换**
例：https://leetcode.com/problems/climbing-stairs/#/description
思路清晰很容易一气呵成的答案。但是，跑不过。。。
```js
var climbStairs = function (n) {
    if(n == 0) {
        return 1;
    }
    if(n < 0) {
        return 0;
    }
    return climbStairs(n - 1) + climbStairs(n - 2);
}
```
这个递归差不多O(n^2)的时间复杂度。来看一下这个过程。
```js
f(5)
=> f(4) + f(3)
=> f(3) + f(2) + f(2) + f(1)
=> f(3) + f(2) + f(2) + f(1)
=> f(2) + f(1) + f(2) + f(2) + f(1)
=> ...........
```
实际上有太多的重复计算，比如在求f(4)的途中已经计算出f(3)了，所以不应该再去重复计算。类似的其他也一样，所以利用闭包，将每次计算的结果缓存起来，发现这样就可以跑过了，且与下面的该题的另一种求法速度差不多，时间复杂度是O(n)。
```js
var climbStairs = function (n) {
    function memory (func) {
        var mem = {};
        return function () {
            var argKey = [].slice.call(arguments).toString();
            if(mem[argKey]) {
                return mem[argKey];
            }
            var result = func.apply(this, arguments);
            mem[argKey] = result;
            return result;
        }
    }
    var climb = memory(function  (n) {
        if(n == 0) {
            return 1;
        }
        if(n < 0) {
            return 0;
        }
        return climb(n - 1) + climb(n - 2);
    })
    return climb(n);
}
```

**2,预解析数据结构**
例：https://leetcode.com/problems/two-sum/#/description
对于简单查重，可以将字符串中的每一位记录下到map上（增加空间），在查重时读map，读map的时间复杂度是O(1)，所以置换出了时间。先将数字和对应的index存起来，然后遍历数组，并利用之前存储的结果检查**target与这个数字的差**是不是同样存在这个数组中。
```js
var twoSum = function(nums, target) {
    var map = {};
    var nlength = nums.length;
    for(var i = 0 ; i < nlength ; i ++) {
        map[nums[i]] = i;
    }
    
    for(i = 0 ; i < nlength ; i ++) {
        if (map[target - nums[i]] !== undefined && map[target - nums[i]] !== i) {
            return [map[target - nums[i]], i];
        }
    }
};
```
注意：***如果key是一个整数，那么最好使用数组来替代Map***。
类似的 
- https://leetcode.com/problems/count-primes/#/description
- https://leetcode.com/problems/single-number/#/description
- https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/#/description
- https://leetcode.com/problems/find-the-difference/#/description
- https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/#/description
- https://leetcode.com/problems/intersection-of-two-arrays/#/description
- https://leetcode.com/problems/valid-anagram/#/description
- https://leetcode.com/problems/isomorphic-strings/#/description
- https://leetcode.com/problems/keyboard-row/#/description

##### 递归
例：https://leetcode.com/problems/find-the-difference/#/description
上面的题是计算树的深度。这个题目很简单，不过从这个题目可以看到递归的各种写法的速度。
个人推崇的写法。习惯尾递归面向未来。
```js
var obj = {maxDeep: 0};
function traverse (cur, deep, obj) {
    if(!cur.left && !cur.right) {
        obj.maxDeep = deep > obj.maxDeep ? deep : obj.maxDeep;
        return;
    }
    
    if(cur.left) {
        traverse (cur.left, deep + 1, obj);
    }
    
    if(cur.right) {
        traverse (cur.right, deep + 1, obj);
    }
}
```
我认为最不好的写法。跨作用域（递归中是多层作用域）。
```js
var maxDeep = 0;
function traverse (cur, deep) {
    if(!cur.left && !cur.right) {
        maxDeep = deep > maxDeep ? deep : maxDeep;
        return;
    }
    
    if(cur.left) {
        traverse (cur.left, deep + 1);
    }
    
    if(cur.right) {
        traverse (cur.right, deep + 1);
    }
}
traverse(root, 1);
```
流行写法。
```js
function traverse (cur) {
    if(!cur.left && !cur.right) {
        return 1;
    }
    
    var leftDeep = 0;
    var rightDeep = 0;
    
    if(cur.left) {
        leftDeep = 1 + traverse (cur.left);
    }
    
    if(cur.right) {
        rightDeep =  1 + traverse (cur.right);
    }
    
    return Math.max(leftDeep, rightDeep);
}
return traverse(root);
```
类似的
- https://leetcode.com/problems/invert-binary-tree/#/description
- https://leetcode.com/problems/sum-of-left-leaves/#/description
- https://leetcode.com/problems/predict-the-winner/#/description
- https://leetcode.com/problems/combination-sum-iii/#/description

##### 基本的数据结构
链表和二叉树，基本上是福利题。
数据结构库：
- 谷歌的库 https://google.github.io/closure-library/api/goog.structs.html

类似的
- 链表 https://leetcode.com/problems/delete-node-in-a-linked-list/#/description
- 二叉树 https://leetcode.com/problems/same-tree/#/description
- 链表 https://leetcode.com/problems/reverse-linked-list/#/description
- 二叉树 https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/#/description
- 链表 https://leetcode.com/problems/remove-duplicates-from-sorted-list/#/description
- 二叉树（利用BST的性质）https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/#/description
- 链表 https://leetcode.com/problems/remove-linked-list-elements/#/description
- 链表 https://leetcode.com/problems/intersection-of-two-linked-lists/#/description
- 优先队列 https://leetcode.com/problems/third-maximum-number/#/description
- 二叉树 https://leetcode.com/problems/kth-smallest-element-in-a-bst/#/description

##### 二分法
例：https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/#/description
二分法把普通查找的时间复杂度降到了O(logn)。有好几个题用了二分法，二分法典型的应用，有序数组转二叉查找树。

```js
var sortedArrayToBST = function(nums) {
    var n = nums.length;
    var start = 0;
    var end = n - 1;
    
    function traverse(nums, start, end) {
        if(start > end) {
            return null;
        }
        
        var mid = parseInt((start + end) / 2)
        var currentNode = new TreeNode(nums[mid]);
        currentNode.left = traverse(nums, start, mid - 1);
        currentNode.right = traverse(nums, mid + 1, end);
        
        return currentNode;
        
    }
    
    return traverse(nums, start, end);
    
};
```

类似的：
- https://leetcode.com/problems/search-insert-position/#/description
- https://leetcode.com/problems/license-key-formatting/#/description

##### 位运算

位运算的题稍微有点绕，但位运算跟数学方法一样的高效。leetcode discuss上面有网友总结了位运算的一些经验，还不错，我翻译了一下，http://www.jianshu.com/p/61b2cda08134。

例1：https://leetcode.com/problems/number-of-1-bits/
每次移除最后的1，`n = n & (n - 1)`，直到没有1。

```js
var hammingWeight = function(n) {
    var count = 0 ;
    while(n) {
        n = n & (n - 1);
        count ++;
    }
    return count;
};
```

例2：https://leetcode.com/problems/sum-of-two-integers/#/description
首先可以想到的是不让用加减乘除那么可能会是位运算。答案如下。首先不是自己想出来的，然后这段代码如何工作也是想了挺久。首先去想两个二进制相加的过程，对于某位上的两个数相加，如果都是1，则本位变成0，且需要进位，含有0则不进位，所以两个数的不进位和为`a ^ b`，没有进位则结束了，有进位则`a & b`表示高位的进位。这样就变成了 `a ^ b` 与 `a & b << 1`求和，终点为无进位。
在leetcode的discuss上面，有网友对此类问题做了很好的总结。

```js
var getSum = function(a, b) {
    if(a == 0) return b;
    if(b == 0) return a;
    var carry = 0;
    while (b != 0) {
        carry = a & b;
        a = a ^ b;
        b = carry << 1;
    }
    return a;
};
```
有些题很难想到可以用位运算来解决，可是去看位运算解法的时候还是令人不禁拍案叫绝。

类似的：
- https://leetcode.com/problems/hamming-distance
- https://leetcode.com/problems/power-of-two/#/description
- https://leetcode.com/problems/power-of-four/#/description
- https://leetcode.com/problems/reverse-bits/#/description
- https://leetcode.com/problems/counting-bits/#/description
- https://leetcode.com/problems/single-number-iii/#/description
- 位操作中加了点数学思想  https://leetcode.com/problems/total-hamming-distance/#/description
- https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/#/description
- https://leetcode.com/problems/maximum-product-of-word-lengths/#/description
- https://leetcode.com/problems/single-number-ii/

##### 栈
例1：https://leetcode.com/problems/valid-parentheses/#/description
典型的栈应用。不必多说。
```js
var isValid = function(s) {
    
    if(s.length <= 1) {
        return false;
    }
    
    var stack = [];
    function getTop () {
        return stack[stack.length - 1];
    }
    
    function getMatch (ch) {
        var matchMap = {
            ')': '(',
            '}': '{',
            ']': '['
        }
        return matchMap[ch]
    }
    
    var slength = s.length;
    for(var i = 0 ; i < slength ; i ++) {
        var ch = s[i];
    
        if(['(', '{', '['].indexOf(ch) !== -1) {
            stack.push(ch);
        }
        
        //寻求与栈顶配对
        var shouldMatch = getMatch(ch);
        if(shouldMatch) {
            // 配对则pop
            if(getMatch(ch) === getTop()) {
                stack.pop();
            } else {
                //没配对直接返回false
                return false;
            }
        }
    }
    
    return stack.length === 0;
};
```
类似的：
- https://leetcode.com/problems/next-greater-element-ii/#/description
- https://leetcode.com/problems/next-greater-element-i/#/description
- https://leetcode.com/problems/flatten-nested-list-iterator/#/description

##### 逆向思维
例：https://leetcode.com/problems/minimum-moves-to-equal-array-elements/#/description
有时候逆向思维比正向思维好理解得多。比如上面的题（答案如下），每次选两个加1，最终所有相等，的逆向思维过程为每次选一个减1，最终所有相等。但前者用算法确实比较难实现，后者则是一个很简单的过程。
```js
var minMoves = function(nums) {
    var min = Math.min.apply(null, nums);
    var length = nums.length;
    var allsum = nums.reduce(function (result, current) {
        return result + current;
    }, 0);
    
    return allsum - length * min;
};
```

类似的：
- https://leetcode.com/problems/missing-number/#/description
- https://leetcode.com/problems/non-overlapping-intervals/#/description

##### 递归展平
感觉是最难的了，用递归很清晰的思路，被题目的时间复杂度卡死了。就得想着展平递归。

- https://leetcode.com/problems/longest-palindromic-subsequence/#/description
- https://leetcode.com/problems/combination-sum-iv/#/description

##### 动态规划
例1：https://leetcode.com/problems/maximum-subarray
动态规划是一个很大的话题，不应该算是一种算法，应该算是一种思维方式，一种承上启下的思维方式。分析前后关系的过程更像是做数学题。

如该例答案，求最大和，每次将当前数字累加，只需考虑当前结果对后续结果的影响，且每次检查最大值是否还是最大值。当前结果小于0则认为当前结果对后续结果有反作用，所以抛弃之前的累加。只要聚焦在前面对后面的影响，就很好理解了。

```js
var maxSubArray = function(nums) {

    var max = -Infinity;
    nums.reduce((result, current) => {
        result += current;

        if(result > max) {
            max = result;
        }

        if(result < 0) {
            result = 0;
        }

        return result;
    }, 0);

    return max;
};
```

例2：https://leetcode.com/problems/climbing-stairs/#/description
上n层台阶时，有两种途径，上到 n-1 层，再上一层，上到 n-2 层，再上两层，这是核心思想，也就是`f(n) = f(n - 1) + f(n - 2)`。与上面递归的方法（memory方法）不同的是，动态规划从正向去思考。首先几个特殊的case return掉。当n >= 3的时候，开始从 n == 1 的结果和 n == 2 的结果去正向推，下一次结果为`f(n + 1) = f(n) + f(n - 1)`，下一次的n-1的情况是上次累加的结果，下一次的n-2的情况是上次的n-1情况。过程类似下面等式。

```js
                 f(n)        =        f(n - 1) + f(n - 2)
                  ||                     ||
      f(n + 1) = f((n + 1) - 1)   +   f((n + 1) - 2)
```

```js
var climbStairs = function (n) {
    // base cases
    if(n <= 0) return 0;
    if(n == 1) return 1;
    if(n == 2) return 2;
    
    var one_step_before = 2;
    var two_steps_before = 1;
    var all_ways = 0;
    
    for (var i = 2 ; i < n ; i ++) {
    	all_ways = one_step_before + two_steps_before;
    	two_steps_before = one_step_before;
        one_step_before = all_ways;
    }
    return all_ways;
}
```
例3：https://leetcode.com/problems/house-robber/#/description
招数还是抓好前后关系。偷i的最大收益是，当前收益加上不偷i-1的最大收益，不偷i的最大收益则取决于，i-1次的最大收益。
```js
notRob(i) = Max(i - 1) = Math.max(rob(i - 1), notRob(i - 1));
rob(i) = notRob(i - 1) + $(i);

Max(i) = Math.max(rob(i), notRob(i));
```
```js
var rob = function(nums) {
    var rob = 0;
    var notRob = 0;
    var current = 0;
    var nlength = nums.length;
    
    for(var i = 0 ; i < nlength ; i ++) {
        rob = notRob + nums[i];  // rob(i) = notRob(i - 1) + $(i);
        notRob = Math.max(current, notRob);  // notRob(i) = Max(i - 1) = Math.max(rob(i - 1), notRob(i - 1));
        current = rob;
    }
    return rob > notRob ? rob : notRob; // Max(i) = Math.max(rob(i), notRob(i));
};
```
类似的：
- https://leetcode.com/problems/best-time-to-buy-and-sell-stock/#/description
- https://leetcode.com/problems/longest-palindromic-substring/#/description
- https://leetcode.com/problems/unique-binary-search-trees/#/description
- https://leetcode.com/problems/unique-paths
- https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/#/description

##### 长短步
解决一些带有循环性质的数学问题。或者在解决链表问题时，用来检查链表是否存在圈，或者取链表的中位。
例：https://leetcode.com/problems/best-time-to-buy-and-sell-stock/#/description
绕圈问题可以用长短步的方式解决。

```js
var isHappy = function(n) {
    function check (n) {
        var sum = 0;
        var temp;
        while(n) {
            temp = n % 10;
            sum += temp * temp;
            n /= 10;
        }
        
        return parseInt(sum);
    }
    
    var slow = n;
    var fast = n;
    do {
        slow = check(slow);
        fast = check(fast);
        fast = check(fast);
    } while(slow != fast);
    if(slow == 1) return true;
    else return false;
};
```
类似的：
- https://leetcode.com/problems/linked-list-cycle/#/description
- https://leetcode.com/problems/palindrome-linked-list/#/description
- 绕圈的思想  https://leetcode.com/problems/intersection-of-two-linked-lists/#/description
- https://leetcode.com/problems/find-the-duplicate-number/#/description
- https://leetcode.com/problems/remove-nth-node-from-end-of-list/#/description

##### 滑动窗口
例：https://leetcode.com/problems/find-all-anagrams-in-a-string/#/description
left和right都从左到右一次，所以是O(n)。有位网友整理的方法不错，比较直观，我简单翻译了一下 http://www.jianshu.com/p/71be03fc80b7（还有另外一个https://discuss.leetcode.com/topic/30941/here-is-a-10-line-template-that-can-solve-most-substring-problems）。本例就可以通过这个模板实现。当每个key的value都降到0以下的时候，我们认为构成子串的“材料充足”，这里我们的收集条件是`end - begin == tlength`，并且begin左移的时候“释放材料”，直到“材料不足”`map[tempc] > 0`，表示又有一个key无法满足了，此时end应该右移。
```js
var findAnagrams = function(s, t) {
    var result = [];
    if(t.length > s.length) return result;
    var map = {};
    var slength = s.length;
    var tlength = t.length;
    for(let i = 0 ; i < tlength ; i ++){
        map[t[i]] = map[t[i]] || 0;
        map[t[i]] ++;
    }
    var counter = Object.keys(map).length;
    
    var begin = 0, end = 0;
    var head = 0;
    var len = Infinity;
    
    
    while(end < slength){
        var c = s[end];
        if( c in map ){
            map[c] --;
            if (map[c] === 0) counter --;
        }
        end ++;
        
        // 到头了
        while (counter === 0) {
            console.log(begin, end, map)
            var tempc = s[begin];
            if (tempc in map) {
                map[tempc] ++;
                if(map[tempc] > 0){
                    counter++;
                }
            }
            if(end - begin == tlength){
                result.push(begin);
            }
            begin++;
        }
        
    }
    return result;
    
};
```
类似的：
- [https://leetcode.com/problems/minimum-window-substring/](https://leetcode.com/problems/minimum-window-substring/)
- [https://leetcode.com/problems/longest-substring-without-repeating-characters/](https://leetcode.com/problems/longest-substring-without-repeating-characters/)
- [https://leetcode.com/problems/substring-with-concatenation-of-all-words/](https://leetcode.com/problems/substring-with-concatenation-of-all-words/)
- [https://leetcode.com/problems/longest-substring-with-at-most-two-distinct-characters/](https://leetcode.com/problems/longest-substring-with-at-most-two-distinct-characters/)
- [https://leetcode.com/problems/find-all-anagrams-in-a-string/](https://leetcode.com/problems/find-all-anagrams-in-a-string/)
- https://leetcode.com/problems/longest-repeating-character-replacement/#/description

##### 零空间
也勉强算是一个题型吧。。。
例：https://leetcode.com/problems/remove-element/#/description
说技巧大概就是确保被覆盖的信息已经无用吧。。比如这个例子，一个慢index，一个快index，慢index覆盖的信息已经被快index消费了，所以不会有副作用。
```js
var removeElement = function (nums, val) {
    var index = 0;
    var nlength = nums.length;
    for(var i = 0 ; i < nlength ; i ++) {
        if(nums[i] !== val) {
            nums[index] = nums[i];
            index ++;
        }
    }
    nums.splice(index, nlength);
};
```
类似的：
- https://leetcode.com/problems/merge-sorted-array/#/description
- https://leetcode.com/problems/remove-duplicates-from-sorted-array/#/description

##### 其他
***KMP算法*** 
例：https://leetcode.com/problems/implement-strstr/
***桶排序***
例：https://leetcode.com/problems/top-k-frequent-elements/#/description
javascript使用桶排序有优势，稀疏数组不会占太多的memory。
```js
var topKFrequent = function(nums, k) {
    var fres = {};
    var nlength = nums.length;
    for(var i = 0 ; i < nlength ; i ++) {
        fres[nums[i]] = fres[nums[i]] || 0;
        fres[nums[i]] ++;
    }
    
    // 桶排序
    var buckets = [];
    Object.keys(fres).forEach(key => {
        buckets[Number(fres[key])] = buckets[Number(fres[key])] || [];
        buckets[Number(fres[key])].push(Number(key));
    });
    
    var result = [];
    for(var i = buckets.length - 1 ; result.length < k ; i --) {
        if(!buckets[i]) {
            continue;
        } else {
            result = result.concat(buckets[i]);
        }
    }
    return result;
};
```
类似的
- https://leetcode.com/problems/sort-characters-by-frequency/#/description

***弗洛伊德算法***
- https://leetcode.com/problems/evaluate-division/#/description

***冗长无聊的题***
- https://leetcode.com/problems/diagonal-traverse/#/description
- https://leetcode.com/problems/rotate-array/#/description
---
date: 2016-06-12
tags: css
---

是tracks不是tricks。使用纯css技术如何实现各种运动轨迹。

这里的轨迹指曲线轨迹，直线轨迹实现起来比较简单，比如正方形实际上就是四次translate。

### 椭圆
这里的椭圆不是正椭圆，是伪椭圆。这里有两种思路实现椭圆轨迹运动。

#### 思路一
在圆形轨道运动基础上，圆心做震荡运动，两者运动的时长相同。注意震荡动画的timing-function需要调整为ease-in-out形式，linear会出现拐直角的效果。

实例演示：https://jsfiddle.net/488j1rhn/

#### 思路二
xy轴共同震荡。震动的相位差90度。

实例演示：https://jsfiddle.net/b78sqhp8/

### 贝塞尔曲线
x轴模拟时间，y轴还原路程信息。

实例演示：https://jsfiddle.net/edLga1m3/1/
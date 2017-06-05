需要重构一下组内的一个可视化平台，再加上这一年来总是再用highcharts，所以整理一下，这也算是一个标准的图标库，有哪些有用的特性，可以对标到其他chart lib上。

方式是跟着highcharts的demo走，相当于建一个`特性 -> demo`的索引。目前整理相对表象的特征，每个demo里的细节配置，不做发掘。且如果上面例子提及，下面例子不再赘述。

***

https://www.highcharts.com/demo/line-ajax

- 双纵轴。
- 多条折现共享tiptool。
- 设置横纵轴label的位置。
- 设置legend的位置。

https://www.highcharts.com/demo/line-labels

- 免上浮数据展示。

https://www.highcharts.com/demo/line-time-series

- 面积图。
- 缩放（zoom）。
- 面积图渐变色。

https://www.highcharts.com/demo/spline-inverted

- x,y翻转。
- data中item的数组格式。

https://www.highcharts.com/demo/spline-symbols

- data中item的js对象格式。
- 自定义marker样式。

https://www.highcharts.com/demo/spline-plot-bands

- 设置背景条（指标值定级，如80~100优）。

https://www.highcharts.com/demo/spline-irregular-time

- 类型为时间的横坐标（多语言支持如何？）。

https://www.highcharts.com/demo/line-log-axis

- 差距为某数量级的y轴。

https://www.highcharts.com/demo/area-basic

- 面积图base。

https://www.highcharts.com/demo/area-negative

- 值可以是negative。

https://www.highcharts.com/demo/area-stacked

- 堆叠面积图demo（关键配置stacking: 'normal'）。
- shared和noShared混合版的tiptool（算无tiptool的情况，现在有四种了）。

https://www.highcharts.com/demo/area-stacked-percent

- 堆叠面积百分图（关键配置stacking: 'percent'）。

https://www.highcharts.com/demo/areaspline

- 横向场景布置（需要特殊标记的x轴，如周末）。

https://www.highcharts.com/demo/arearange

- 面积区域图。

https://www.highcharts.com/demo/arearange-line

- 面积图搭配折线图（最大最小平均值）。
- 面积区域图的数据格式（每个item三个）。



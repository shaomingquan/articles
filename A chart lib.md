需要重构一下组内的一个可视化平台，再加上这一年来总是再用highcharts，所以整理一下，这也算是一个标准的图标库，有哪些有用的特性，可以对标到其他chart lib上。

方式是跟着highcharts的demo走，***相当于建一个`特性 -> demo`的索引***。目前整理相对表象的特征，每个demo里的细节配置，不做发掘。且如果上面例子提及，下面例子不再赘述。有时将highcharts简称hc。

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

https://www.highcharts.com/demo/bar-stacked

- 柱状堆叠。

https://www.highcharts.com/demo/bar-negative-stack

- 正负堆叠。

https://www.highcharts.com/demo/column-stacked-and-grouped

- 指定stack（group the columns）。

https://www.highcharts.com/demo/column-stacked-percent

- 百分比柱状堆叠。

https://www.highcharts.com/demo/column-rotated-labels

- label防拥挤（xLabel，dataLabel旋转）。

https://www.highcharts.com/demo/column-drilldown

- chart in chart（drilldown: 不局限子图表可以是任何类型的）。

https://www.highcharts.com/demo/column-placement

- 柱状图样式示例。

https://www.highcharts.com/demo/column-parsed

- 通过html表格生成柱状图（如果不是数字？）。

https://www.highcharts.com/demo/columnrange

- 柱状range图（range图普遍规律，key point:双数据）。

https://www.highcharts.com/demo/pie-basic

- pie basic（dataLabel加格式）

https://www.highcharts.com/demo/pie-legend

- 启动Legend（showInLegend: true）。
- pie的data格式与前面的别无二致（此处obj格式的数据体现了更易于添加配置的特点）。

https://www.highcharts.com/demo/pie-donut

- 双层饼图basic。（并不智能，智能的代码需自己封装，双层的样式实际上的“环套饼”）。

https://www.highcharts.com/demo/pie-semi-circle

- 半饼图demo（中间的是title）。

https://www.highcharts.com/demo/pie-drilldown

- chart in chart pie demo

***

以上是基础图表。

***

https://www.highcharts.com/demo/synchronized-charts

- 图表间交互同步（图表联动）。

https://www.highcharts.com/demo/combo

- 图表混合（加入pie，数据上与spline和column混合别无二致，不过hc不负责布局pie，用户需手动布局，不然效果很惨）。

https://www.highcharts.com/demo/combo-multi-axes

- 三纵轴（所以算多轴吧，不过这样很乱）。

https://www.highcharts.com/demo/combo-histogram

- 散点加区域汇总demo。

https://www.highcharts.com/demo/combo-regression

- 线性回归demo。

https://www.highcharts.com/demo/combo-meteogram

https://www.highcharts.com/demo/combo-timeline

- 复杂demo（上面两个，十分花哨）。




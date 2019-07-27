可能以后的重点方向在pc站上面了，最近也是各种弄pc站的需求。pc站页面宽，但是也不是无极限的宽，用户也可能是台式机，笔记本。

### 优化1：长文字

大段文字挤在小地方，阅读体验不好，在项目中，我使用一个模态框展示全部文字，在原文位置截取前五十字并追加“查看全部”link，以触发模态框弹出。模态框是个展示全部信息的好组件。

### 优化2：大table

行列都非常多的table直接展示非常不易查看：

- 如果列很多且固定宽度，每一列压缩到一个很小的空间，表头被挤压成竖排
- 如果行非常多，往下滚动之后看不见表头是什么

表内滚动，列固定

- antd: https://ant.design/components/table-cn/#components-table-demo-fixed-columns-header
- 祖师爷rc-table: http://react-component.github.io/table/examples/fixedColumnsAndHeader.html
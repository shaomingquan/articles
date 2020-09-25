---
date: 2019-05-21
tags: javascript
---

> 对于典型的现代浏览器架构，优化的思路及快速参考。原理参考[gpu-accelerated-compositing-in-chrome](http://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome)。

思路：
- 减少pipeline中的步骤。
- 减少RenderLayer个数。
- 合理控制GraphicsLayer个数。
- 尽量使用可以被GPU加速的属性。
- 减小layout和paint的scope。

### 减少pipeline中的步骤

[csstriggers](https://csstriggers.com/)

- repaint（Paint） 少用。
- reflow（Layout） 慎用。

### 减少RenderLayer个数

见[gpu-accelerated-compositing-in-chrome](http://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome) 的 From RenderObjects to RenderLayers小节。

### 合理控制GraphicsLayer个数

见[gpu-accelerated-compositing-in-chrome](http://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome) 的 From RenderLayers to GraphicsLayers小节。

### 尽量使用可以被GPU加速的属性

[csstriggers](https://csstriggers.com/)

- 只影响Composite阶段的属性。

### 减小layout和paint的scope

[CSS contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)

[introducing-layout-boundaries](http://wilsonpage.co.uk/introducing-layout-boundaries/)
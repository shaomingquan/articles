### v4 => v6

- 增加了国际化方案（stable）
- 增加`N-API`，实现跨node v8版本（实验阶段，v8 stable）
- 期间v8版本来到了5.0，支持93% es6的feature，原本是46%，增幅可谓最大

### v6 => v8

- 增加async hooks（实验阶段，至今未stable）
- 支持原生的esModule（实验阶段，部分特性未支持，且需要加flag`--experimental-modules`，12 stable）
- 支持http2（stable）
- 支持可编程的inspector（实验阶段，v14 stable）
- 增加perf_hooks（实验阶段，v12 stable）
- 增加trace能力（实验阶段，至今未stable）
- 期间v8来到了5.9，支持最新的compiler pipeline（TurboFan + Ignition）
- npm来到了v5.0

### v8 => v10

- 增强trace能力，增加可编程api（实验阶段，至今未stable）
- 官方支持worker_thread（实验阶段，v12 stable）

### v10 => v12

- 增加导出diagnostic summary的方案（stable）
- 增加wasi支持（实验阶段，至今未stable）

### v12 => v14

- 增加corepack，包管理工具代理，专属版npx（实验阶段，至今未stable）
- 增加diagnostics channel，诊断专用eventEmitter（实验阶段，至今未stable）

### v14 => v16

- 增加asynchronous context tracking，对于async_hooks最常见的使用方法的一种官方封装（stable）
- 增加web crypto api，对齐web方便同构（实验阶段，至今未stable）
- 增加web streams api，对齐web方便同构（实验阶段，至今未stable）

### 参考

- https://node.green/
- https://nodejs.org/en/blog/release/v6.0.0/
- https://nodejs.org/en/blog/release/v8.0.0/
- https://nodejs.org/en/blog/release/v10.0.0/
- https://nodejs.org/en/blog/release/v12.0.0/
- https://nodejs.org/en/blog/release/v14.0.0/
- https://nodejs.org/en/blog/release/v16.0.0/

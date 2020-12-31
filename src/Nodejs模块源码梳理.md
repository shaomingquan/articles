---
date: 2020-12-31
tags: nodejs
---

> node@10，碎片信息整理

## 主流程

1. compile phase
    1. 宏展开
    2. 编译js源码到二进制
2. runtime phase
    1. bootstrap
    2. 注入模块体系到js
    2. js模块体系

## compile phase

准备工作。在nodejs的模块定义以及初始化中使用了一些宏

```c++
// Call built-in modules' _register_<module name> function to
// do module registration explicitly.
void RegisterBuiltinModules() {
#define V(modname) _register_##modname();
  NODE_BUILTIN_MODULES(V)
#undef V
}
```

过程
1. src/node.cc
2. lib/internal/bootstrap/node.js

抛出build-in mod
1. 每个模块中使用 NODE_BUILTIN_MODULE_CONTEXT_AWARE 抛出自身
    1. _register_ 会调用 node_module_register，实现挂linked-list
2. NODE_BUILTIN_MODULES
    1. init中的RegisterBuiltinModules调用了NODE_BUILTIN_MODULES
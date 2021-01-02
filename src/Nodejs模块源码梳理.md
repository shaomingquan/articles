---
date: 2020-12-31
tags: nodejs
---

> node@10，碎片信息整理

## 主流程

1. compile phase
    1. 宏展开
        1. 模块定义
        2. 初始化模块链表
    2. 编译js源码到二进制
2. runtime phase
    1. bootstrap
    2. 注入模块体系到js
    3. 用户端require
        1. 用户代码的require
        2. nodejs源代码的require

## compile phase

### 宏展开 - 模块定义

在每个内部模块文件末尾，都有一个`NODE_BUILTIN_MODULE_CONTEXT_AWARE`。

```c++
// src/node_url.cc
NODE_BUILTIN_MODULE_CONTEXT_AWARE(url, node::url::Initialize)
```

```c++
// src/node_internals.h
#define NODE_BUILTIN_MODULE_CONTEXT_AWARE(modname, regfunc)                   \
  NODE_MODULE_CONTEXT_AWARE_CPP(modname, regfunc, nullptr, NM_F_BUILTIN)


#define NODE_MODULE_CONTEXT_AWARE_CPP(modname, regfunc, priv, flags)          \
  static node::node_module _module = {                                        \
    NODE_MODULE_VERSION,                                                      \
    flags,                                                                    \
    nullptr,                                                                  \
    __FILE__,                                                                 \
    nullptr,                                                                  \
    (node::addon_context_register_func) (regfunc),                            \
    NODE_STRINGIFY(modname),                                                  \
    priv,                                                                     \
    nullptr                                                                   \
  };                                                                          \
  void _register_ ## modname() {                                              \
    node_module_register(&_module);                                           \
  }
```

不难发现其实只是定义了：

- 结构体
- 注册函数

### 宏展开 - 初始化模块链表

上面展开的注册函数里面会调用`node_module_register`，在`node_module_register`，通过`node_module`结构体的`nm_link`指针，串起了`modlist_builtin`模块链表，以备运行时使用。

真正的注册函数调用也是通过宏来做的，在`Init`里，会调用`RegisterBuiltinModules`，下面是`RegisterBuiltinModules`。


```c++
// src/node.cc
// Call built-in modules' _register_<module name> function to
// do module registration explicitly.
void RegisterBuiltinModules() {
#define V(modname) _register_##modname();
  NODE_BUILTIN_MODULES(V)
#undef V
}

// src/node_internals.h
#define NODE_BUILTIN_MODULES(V)                                               \
  NODE_BUILTIN_STANDARD_MODULES(V)                                            \
  NODE_BUILTIN_OPENSSL_MODULES(V)                                             \
  NODE_BUILTIN_ICU_MODULES(V)

#define NODE_BUILTIN_STANDARD_MODULES(V)                                      \
    V(async_wrap)                                                             \
    // mod2...
    // mod3...
    // mod4...
```

不难看出，这里就是调用了各种模块的注册函数。

### 编译js代码到二进制

node源码有两部分c++部分写一些底层，也有很多js来做封装。有一个脚本`tools/js2c.py`，这里细节不看了，其实就是把相关库的js以字符串的形式存到c++文件里。以备后续引入native模块使用。

## runtime phase

## runtime phase - boostrap

启动：

1. src/node.cc
2. lib/internal/bootstrap/loaders.js
3. lib/internal/bootstrap/node.js

在`src/node.cc`中，编译并获得了`lib/internal/bootstrap/loaders.js`的返回，存在v8的Local里，然后会作为参数给`lib/internal/bootstrap/node.js`。

```c++
  // src/node.cc
  Local<Value> loaders_bootstrapper_args[] = {
    env->process_object(),
    get_binding_fn,
    get_linked_binding_fn,
    get_internal_binding_fn,
    Boolean::New(env->isolate(),
                 env->options()->debug_options->break_node_first_line)
  };

  // Bootstrap internal loaders
  Local<Value> bootstrapped_loaders;
  if (!ExecuteBootstrapper(env, loaders_bootstrapper.ToLocalChecked(),
                           arraysize(loaders_bootstrapper_args),
                           loaders_bootstrapper_args,
                           &bootstrapped_loaders)) {
    return;
  }

  // Bootstrap Node.js
  Local<Object> bootstrapper = Object::New(env->isolate());
  SetupBootstrapObject(env, bootstrapper);
  Local<Value> bootstrapped_node;
  Local<Value> node_bootstrapper_args[] = {
    env->process_object(),
    bootstrapper,
    bootstrapped_loaders
  };
  if (!ExecuteBootstrapper(env, node_bootstrapper.ToLocalChecked(),
                           arraysize(node_bootstrapper_args),
                           node_bootstrapper_args,
                           &bootstrapped_node)) {
    return;
  }
```

这里看代码的思路是：

- 先看两个js的核心逻辑
- 在看注入的函数在c++的核心逻辑

在`loaders.js`内部，定义了nodejs内部js模块的一些逻辑，这些内部js模块已经提前被编译近二进制了，通过`getBinding('natives');`获取，如果未被提前编译，则为非法内部模块。同时给`process`对象挂载了`binding`方法，这个是用户打通到`nodejs`内部的核心方法。

随后通过`NativeModule`引入`internal/modules/cjs/loader`再执行`Module.runMain`。

```js
// lib/internal/bootstrap/node.js
// Make process.argv[1] into a full path.
const path = NativeModule.require('path');
process.argv[1] = path.resolve(process.argv[1]);

const CJSModule = NativeModule.require('internal/modules/cjs/loader');
CJSModule.runMain();
```

```js
// internal/modules/cjs/loader.js
// bootstrap main module.
Module.runMain = function() {
  // 仅保留核心逻辑
  Module._load(process.argv[1], null, true);
};
```

在runMain中，通过`_load`编译用户代码，并注入CommonJS（require，exports）功能。这里开始就把权利交给用户代码了。

## runtime phase - 注入模块体系到js

在nodejs内部的js代码中也有require，用户代码中也有require，这两个require是不同的。所以其实有两套注入逻辑：

- nodejs用户空间代码：lib/internal/modules/cjs/loader.js
- nodejs的js源码：lib/internal/bootstrap/loaders.js

不过require的注入是基本一样的，其实就是把代码包装一下。用户端CommonJS的inject代码：

```js
// internal/modules/cjs/loader.js
let wrap = function(script) {
  return Module.wrapper[0] + script + Module.wrapper[1];
};

const wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];
/*
...
...
...
*/
result = compiledWrapper.call(this.exports, this.exports, require, this,
                                  filename, dirname);
```

同样的，源码require体系的inject

```js
  // lib/internal/bootstrap/loaders.js
  NativeModule.wrap = function(script) {
    return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
  };
  NativeModule.wrapper = [
    '(function (exports, require, module, process, internalBinding) {',
    '\n});'
  ];

  NativeModule.prototype.compile = function() {
    const id = this.id;
    let source = NativeModule.getSource(id);
    // 包装！
    source = NativeModule.wrap(source);

    const script = new ContextifyScript(
        source, this.filename, 0, 0,
        cache, false, undefined
    );

    const fn = script.runInThisContext(-1, true, false);
    const requireFn = this.id.startsWith('internal/deps/') ?
        NativeModule.requireForDeps :
        NativeModule.require;
    fn(this.exports, requireFn, this, process, internalBinding);
  };
```

### runtime phase - 用户端require

关于运行时的require，nodejs在源码有个大体流程的解释

```js
// Check the cache for the requested file.
// 1. If a module already exists in the cache: return its exports object.
// 2. If the module is native: call `NativeModule.require()` with the
//    filename and return the result.
// 3. Otherwise, create a new module for the file and save it to the cache.
//    Then have it load  the file contents before returning its exports
//    object.
Module._load = function(request, parent, isMain) {
  if (parent) {
    debug('Module._load REQUEST %s parent: %s', request, parent.id);
  }

  var filename = Module._resolveFilename(request, parent, isMain);

  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    updateChildren(parent, cachedModule, true);
    return cachedModule.exports;
  }

  if (NativeModule.nonInternalExists(filename)) {
    debug('load native module %s', request);
    return NativeModule.require(filename);
  }

  // Don't call updateChildren(), Module constructor already does.
  var module = new Module(filename, parent);

  if (isMain) {
    process.mainModule = module;
    module.id = '.';
  }

  Module._cache[filename] = module;

  tryModuleLoad(module, filename);

  return module.exports;
};
```

其实就是拆成了两种：

- native代码。http，net，fs之类
- 用户源码。用户以及第三方js源码，json，c++拓展包

用户源码，走`Module.prototype.load`，会根据拓展名选择处理方式

```js
// Native extension for .js
Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(stripBOM(content), filename);
};


// Native extension for .json
Module._extensions['.json'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSON.parse(stripBOM(content));
  } catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};

// Native extension for .node
Module._extensions['.node'] = function(module, filename) {
  return process.dlopen(module, path.toNamespacedPath(filename));
};
```

对于native模块，走`NativeModule.prototype.require`，主逻辑其实很像，都是拿到源码，再包装，注入。关于拿源码，这里就回到了当时把js编译到c++二进制里那个事。

```js
NativeModule._source = getBinding('natives');
```

`getBinding('natives')`就是拿到一个文件和源码的map。再看看c++内部的`GetBinding`实现。

```c++
static void GetBinding(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);

  CHECK(args[0]->IsString());

  Local<String> module = args[0].As<String>();
  node::Utf8Value module_v(env->isolate(), module);

  node_module* mod = get_builtin_module(*module_v);
  Local<Object> exports;
  if (mod != nullptr) {
    exports = InitModule(env, mod, module);
  } else if (!strcmp(*module_v, "constants")) {
    exports = Object::New(env->isolate());
    CHECK(exports->SetPrototype(env->context(),
                                Null(env->isolate())).FromJust());
    DefineConstants(env->isolate(), exports);
  } else if (!strcmp(*module_v, "natives")) {
    exports = Object::New(env->isolate());
    DefineJavaScript(env, exports);
  } else {
    return ThrowIfNoSuchModule(env, *module_v);
  }

  args.GetReturnValue().Set(exports);
}
```

1. 先找内部c++模块。（get_builtin_module就是顺着之前组成的c++ module链表找）
2. 找不到？看看是不是constants
3. 不是？看看是不是natives

如果是natives就调用`DefineJavaScript`，给exports施加一些副作用，抛给js端。通过require是无法直接拿到c++ module的，不过正常来说也不需要。但是nodejs也并没有卡死，用户仍然可以通过`process.binding`拿到c++ module。

> `process.binding` 文档不可查，理论上并不推荐用户使用

```js
const fsNative = process.binding('fs')
const fs = require('fs')
fsNative === fs // false
```

`require('fs')`实际上引用了`lib/fs.js`，做了很多封装，让api更优化。

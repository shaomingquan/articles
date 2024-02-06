---
date: 2024-02-03
tags: javascript
---

RSC是一个很酷的功能，但从开发者角度来看是个大大的黑盒，通过解读 https://github.com/bholmesdev/simple-rsc，来从稍微底层的角度看RSC，缩小黑盒。


## 整体运行过程

1. 启动服务，打包相关文件，serve静态资源

比较简单，但这个大build函数东西有点多，后面说

```javascript

/**
 * Serve your `build/` folder as static assets.
 * Allows you to serve built client components
 * to import from your browser.
 */
app.use('/build/*', serveStatic());


serve(app, async (info) => {
	await build();
	console.log(`Listening on http://localhost:${info.port}`);
});
```

2. 加载入口html，加载RSC

入口html不多说
```javascript
/**
 * Endpoint to serve your index route.
 * Includes the loader `/build/_client.js` to request your server component
 * and stream results into `<div id="root">`
 */
app.get('/', async (c) => {
	return c.html(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>React Server Components from Scratch</title>
		<script src="https://cdn.tailwindcss.com"></script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/build/_client.js"></script>
	</body>
	</html>
	`);
});
```

RSC是从客户端发起加载的，由`createFromFetch`负责实例成组件，负责处理RSC协议的response

```javascript

// app/_client.jsx

import { createRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';

// HACK: map webpack resolution to native ESM
// @ts-expect-error Property '__webpack_require__' does not exist on type 'Window & typeof globalThis'.
window.__webpack_require__ = async (id) => {
	debugger;
	return import(id);
};

// @ts-expect-error `root` might be null
const root = createRoot(document.getElementById('root'));

/**
 * Fetch your server component stream from `/rsc`
 * and render results into the root element as they come in.
 */
createFromFetch(fetch('/rsc')).then((comp) => {
	root.render(comp);
});

```

3. 生成复合RSC协议的response

下面代码通过生成了一个stream`curl http://localhost:3000/rsc`

```javascript
/**
 * Endpoint to render your server component to a stream.
 * This uses `react-server-dom-webpack` to parse React elements
 * into encoded virtual DOM elements for the client to read.
 */
app.get('/rsc', async (c) => {
	// Note This will raise a type error until you build with `npm run dev`
	const Page = await import('./build/page.js');
	// @ts-expect-error `Type '() => Promise<any>' is not assignable to type 'FunctionComponent<{}>'`
	const Comp = createElement(Page.default);

	const stream = ReactServerDom.renderToReadableStream(Comp, clientComponentMap);
	return new Response(stream);
});
```

4. 加载client组件，Like

对于client组件的处理在这里，会将其标记成external，并后续单独打包

```javascript
build.onResolve({ filter: reactComponentRegex }, async ({ path: relativePath }) => {
    const path = resolveApp(relativePath);
    const contents = await readFile(path, 'utf-8');

    if (contents.startsWith("'use client'")) {
        clientEntryPoints.add(path);
        return {
            // Avoid bundling client components into the server build.
            external: true,
            // Resolve the client import to the built `.js` file
            // created by the client `esbuild` process below.
            path: relativePath.replace(reactComponentRegex, '.js')
        };
    }
});
```

总之，Like组件单独打包后，会在后续被import异步加载，注意这里的时序：Like是在RSC加载完成后加载的，这个顺序也是RSC协议控制的

本质上潜移默化的完成一个module的lazyload

## RSC协议

## 一些细节
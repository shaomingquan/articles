#### what's this about?
就是下图这个留白，当我往上拉页面拉到最上面还是要继续拉的时候，有时候会有这个带弹性留白，但有的页面却没有，那这是为什么呢？
![Paste_Image.png](http://upload-images.jianshu.io/upload_images/2218079-c472fff4101325a9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### exproling

首先下面的代码时debounce的。
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>JS Bin</title>
</head>
<body>
  <div class="app"></div>
</body>
</html>
```
```css
body, html {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
}
.app {
  height: 100%;
  width: 100%;
  background-color: red;
}
```
如何no debounce？很简单。将css略微改动。
```
body, html {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0; 
  overflow: hidden; /*the key prop*/
}
.app {
  height: 100%;
  width: 100%;
  background-color: red;
}
```
#### extensions

***手机上不行***
上面代码在手机上仍然debounce，我随意找了个h5轮播作品，发现确实可以实现nodebounce，其中的key point是什么呢？

***奇技淫巧1***
添加javascript
```javascript
document.ontouchstart = function (e) {
  e.preventDefault();
}
```
ok确实在手机上也不debounce了，不过`preventDefault`会对浏览器的默认行为进行封杀，debounce没了，**scroll也没了**。但是这**不影响js捕捉用户手势**，所以使用`preventDefault`方案去除debounce的时候，**幻灯片类h5可以良好运转**。

***better***
不需要总是`preventDefault`，在`touchmove`事件中依次递归向上判断元素是否scroll到顶端或者底端，如果存在在顶端或者底端的情况，那么如果此时不`preventDefault`，那么将出现debounce的情况。
小轮子安利：路人哥们的https://github.com/lazd/iNoBounce/blob/master/inobounce.js。

***best***
我厂的桥协议提供一个接口，通过调用这个，便可以一劳永逸，完全消除debounce效果。Hybrid威武！但另一大流量来源微信却没有此接口。

***that's all***
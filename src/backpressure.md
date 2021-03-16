> There is a general problem that occurs during data handling called backpressure and describes a buildup of data behind a buffer during data transfer. When the receiving end of the transfer has complex operations, or is slower for whatever reason, there is a tendency for data from the incoming source to accumulate, like a clog.

在一个传输中，如果接收方变慢了，就会有数据堆积的倾向，就是backpressure。在各种技术栈中都会有方案来解决这个问题（tcp的flow control）。nodejs的Stream可以做数据传输，并且解决了backpressure问题。

> In a computer system, data is transferred from one process to another through pipes, sockets, and signals. In Node.js, we find a similar mechanism called Stream

那么直接监听Readable的data事件，再使用Writable的write方法，就能解决吗？显然是不行的。其实确切的说，是Stream的`pipe`

> When .pipe() is called from the source, it signals to the consumer that there is data to be transferred. The pipe function helps to set up the appropriate backpressure closures for the event triggers.

具体怎么弄呢？首先，Writable的write方法会反馈内部buffer的压力：

> In any scenario where the data buffer has exceeded the highWaterMark or the write queue is currently busy, .write() will return false.

buffer超过highWaterMark，压力出现，会暂停Readable的数据发送，开始清空buffer，当buffer清空，发送drain事件，重新接收数据：

> When a false value is returned, the backpressure system kicks in. It will pause the incoming Readable stream from sending any data and wait until the consumer is ready again. Once the data buffer is emptied, a 'drain' event will be emitted and resume the incoming data flow.

因为nodejs在内部就把backpressure的事情处理好了，所以其实在文档里没有特别说明：

> So, if backpressure is so important, why have you (probably) not heard of it? Well the answer is simple: Node.js does all of this automatically for you.

> That's so great! But also not so great when we are trying to understand how to implement our own custom streams.

但是如果想实现自定义的Stream，还是需要一些深入理解的。

> Once the readable._read() method has been called, it will not be called again until more data is pushed through the readable.push() method. Empty data such as empty buffers and strings will not cause readable._read() to be called.

**一次read，一次push**。如上面所说，read之后，需要调用push才会再调用read。（多次同步push，多次异步push？）。

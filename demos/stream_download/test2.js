const http = require('http')

const { Readable } = require('stream');

const getHelloSource = () => {
    const noop = () => void 0
    let times = 0
    let stoped = false

    const readStart = () => {
        if (stoped) {
            return
        }
        if (times === 20) {
            hooks.onend()
        }
        setTimeout(() => {
            times ++
            hooks.ondata(Buffer.from('hello world\n'))
        }, 1000)
    }

    const readStop = () => {
        stoped = true
    }

    const hooks = {
        ondata: noop,
        onend: noop,
        readStart,
        readStop,
    }
    return hooks
}

class MyReadable extends Readable {
    constructor (options) {
        super(options)
        this._source = getHelloSource()

        // Every time there's data, push it into the internal buffer.
        this._source.ondata = (chunk) => {
            // If push() returns false, then stop reading from source.
            if (!this.push(chunk))
                this._source.readStop();
        };
  
        // When the source ends, push the EOF-signaling `null` chunk.
        this._source.onend = () => {
            this.push(null);
        };
    }
    _read () {
        this._source.readStart()
    }
}

const server = http.createServer((req, res) => {
    // 取消现在会回调这个
    req.on('aborted', () => console.log('aborted'))

    // 取消也会，完成也会
    req.on('close', () => console.log('close'))

    // 暂停相关
    // 如何接受到暂停事件？
    // 其实不接收也可，因为继续写不会有任何问题，浏览器端不会丢弃暂停后写入的数据
    // 所以这个事在后面care就行
    
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', 'attachment;filename="download.txt"')

    ;(new MyReadable()).pipe(res)
})

server.listen(6677)
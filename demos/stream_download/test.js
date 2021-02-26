const http = require('http')

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

    const writeLoop = setInterval(() => {
        res.write('hello world\n')
    }, 1000)
    const timeoutEnd = setTimeout(() => {
        clearImmediate(writeLoop)
        clearTimeout(timeoutEnd)
        res.end('hello world\n')
    }, 1000 * 20)
})

server.listen(6677)
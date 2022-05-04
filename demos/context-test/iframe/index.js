const http = require('http')
const fs = require('fs')

http.createServer((req, res) => {
    const url = req.url
    if (url.indexOf('html') > -1) {
        let file = './main.html'
        if (url.indexOf('iframe') > -1) {
            file = './iframe.html'
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        fs.createReadStream(file).pipe(res)
    }
}).listen('7762')

/**

iframe用v8的context实现，context之间共用一个线程

 */
require('http').createServer((req, res) => {
    console.log(req.url)

    if (req.url.indexOf('javascript') > -1) {
        res.setHeader('content-type', 'application/javascript; charset=utf-8')
    } else {
        res.setHeader('content-type', 'text/html; charset=utf-8')
    }

    if (req.url.indexOf('a.js') > -1) {
        setTimeout(() => {
            res.end(`console.log('this is a.js')`)
        }, 3000)
    } else if (req.url.indexOf('b.js') > -1) {
        res.end(`console.log('this is b.js')`)
    } else {
        require('fs').createReadStream('./js.html').pipe(res)
    }
}).listen(6677)
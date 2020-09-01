require('http').createServer((req, res) => {
    console.log(req.url)

    if (req.url.indexOf('css') > -1) {
        res.setHeader('content-type', 'text/css')
    } else {
        res.setHeader('content-type', 'text/html; charset=utf-8')
    }

    if (req.url.indexOf('a.css') > -1) {
        setTimeout(() => {
            res.end(`#div { color: red }`)
        }, 3000)
    } else {
        require('fs').createReadStream('./css.html').pipe(res)
    }
}).listen(6688)
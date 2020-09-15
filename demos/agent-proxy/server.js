const http = require('http')
const print = require('./print')

const server = http.createServer((req, res) => {
    console.log("req: ", print(req))
    console.log("res: ", print(res))
    res.end('hello')
})

server.listen(5463)
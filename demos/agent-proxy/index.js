const http = require('http')
const net = require('net')
const print = require('./print')
const createConnection = net.createConnection

// 通过改变createConnection创建一个代理


function optModifer (opt) {
    const nextOpt = Object.assign({}, opt)
    nextOpt.host = 'localhost'
    nextOpt.port = '3000'
    return nextOpt
}

http.globalAgent.createConnection = function (opt, oncreate) {
    const nextOpt = optModifer(opt)
    return createConnection.call(this, nextOpt, oncreate)
}

const req = http.request({
    host: 'xxx.taou.com',
    port: '80',
    path: '/',
    method: 'get',
}, (res) => {
    console.log('res', print(res))
    console.log('res.socket', print(res.socket))
    console.log(req.socket === res.socket)
    let ret = ''
    

    res.setEncoding('utf-8')
    res.on('data', str => {
        ret += str
    })
    res.on('end', () => {
        console.log(ret)
    })
})
console.log(print(req))

req.end()
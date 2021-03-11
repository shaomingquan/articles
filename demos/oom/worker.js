console.log('process.execArgv', process.execArgv)
const bufs = {}
setInterval(() => {
    // bufs[Math.random() + ''] = Buffer.alloc(20 * 1024 * 1024, 'x')
    bufs[Math.random() + ''] = (new Array(20 * 1024 * 1024)).fill('x')
    console.log('worker', Object.keys(bufs).length)
    console.log('worker', process.memoryUsage())
}, 50)

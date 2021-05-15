const {
    Worker, isMainThread, parentPort, workerData
  } = require('worker_threads');

if (isMainThread) {
    // setInterval(() => {
    //     console.log(process.memoryUsage())
    // }, 50 * 10000)
    const bufs = {}

    setInterval(() => {
        // bufs[Math.random() + ''] = Buffer.alloc(20 * 1024 * 1024, 'x')
        bufs[Math.random() + ''] = (new Array(20 * 1024 * 1024)).fill('x')
        console.log('main', Object.keys(bufs).length)
        console.log('main', process.memoryUsage())
    }, 50)
    const worker = new Worker(__filename, {
        stdout: false,
        stderr: false,
        // execArgv: [], // process.execArgv,
        // execArgv: ['--max-old-space-size=4096'],
        // --max-old-space-size=1536 会覆盖这个值
        // 但是execArgv怎么设置？
        resourceLimits: {
            maxOldGenerationSizeMb: 512,
            // maxOldGenerationSizeMb: 1536,
        }
    })
    worker.on('error', e => {
        console.log(e)
    })
} else {
    const bufs = {}
    console.log('process.execArgv', process.execArgv)
    setInterval(() => {
        // bufs[Math.random() + ''] = Buffer.alloc(20 * 1024 * 1024, 'x')
        bufs[Math.random() + ''] = (new Array(20 * 1024 * 1024)).fill('x')
        console.log('thread', Object.keys(bufs).length)
        console.log('thread', process.memoryUsage())
    }, 50)
}

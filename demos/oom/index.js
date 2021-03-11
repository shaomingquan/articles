const {
    Worker, isMainThread, parentPort, workerData
  } = require('worker_threads');

if (isMainThread) {
    setInterval(() => {
        console.log(process.memoryUsage())
    }, 50 * 10000)
    setInterval(() => {
        console.log(process.memoryUsage())
    }, 1500)
    const worker = new Worker(__filename, {
        stdout: false,
        stderr: false,
        // execArgv: [], // process.execArgv,
        // V8 options (such as --max-old-space-size) and options that affect the process 
        // (such as --title) are not supported
        // execArgv: ['--max-old-space-size=4096'],
        // --max-old-space-size=1536 会覆盖这个值
        // 但是execArgv怎么设置？
        resourceLimits: {
            // maxOldGenerationSizeMb: 512,
            maxOldGenerationSizeMb: 1536,
        }
    })
    console.log('main pid:', process.pid)
    worker.on('error', e => {
        console.log(e)
    })
} else {
    console.log('worker pid:', process.pid)

    const bufs = {}
    setInterval(() => {
        // bufs[Math.random() + ''] = Buffer.alloc(20 * 1024 * 1024, 'x')
        bufs[Math.random() + ''] = (new Array(20 * 1024 * 1024)).fill('x')
    }, 50)
}

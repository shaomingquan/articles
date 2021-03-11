const { fork } = require('child_process')
const worker = fork(__dirname + '/worker.js', {
    // 同样的参数，使用fork
    execArgv: ['--max-old-space-size=1536'],
    // execArgv: ['--max-old-space-size=512'],
    // stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
})

setInterval(() => {
    console.log('alive')
}, 1000)
worker.on('close', (code) => {
    // 如果内存泄漏则没有推出码
    console.log('worker close: ' + code)
})

// worker.stdout.pipe(process.stdout)
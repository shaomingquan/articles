const { Worker, isMainThread, workerData } = require('worker_threads');

if (isMainThread) {
    const workerData = (new Array(30 * 1024 * 1024)).fill('x')
    const worker = new Worker(__filename, { workerData });
    setTimeout(() => {
        console.log(process.memoryUsage())
    }, 100)
    setTimeout(() => {}, 2000)
} else {
    console.log(workerData.length)
    setTimeout(() => {}, 2000)
}
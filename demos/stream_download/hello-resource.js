const {
    parentPort, 
    workerData // 传个查询条件
} = require('worker_threads');
const { fillChar } = workerData

// task generator
let times = 0 
const makeReadTask = () => {
    if (times === 10) {
        return null
    }
    times ++
    return () => {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('send ' + times, Date.now())
                parentPort.postMessage(Buffer.alloc(4, fillChar))
                resolve()
            }, 200)
        })
    }
}

// task q
const queue = []
let paused = false
let running = false
const runTasks = async () => {
    running = true
    while (queue.length) {
        console.log(queue.length)
        const task = queue.shift()
        if (paused) {
            break
        }
        await task()
    }
    running = false
}


parentPort.on('message', async (msg) => {
    if (msg === 'read') {
        // 恢复读
        paused = false
        // 生成读任务
        const task = makeReadTask()
        if (task !== null) {
            queue.push(task)
        }
        // 重启任务队列
        if (!running && queue.length > 0) {
            runTasks()
        }
        // 任务完成，退出
        if (queue.length === 0 && running === false) {
            process.exit(0)
        }
    } else if (msg === 'pause') {
        // 太快了，暂停读取
        paused = true
    }
})
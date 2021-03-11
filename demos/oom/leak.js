const bufs = {}
setInterval(() => {
    bufs[Math.random() + ''] = (new Array(550 * 1024)).fill('x')
    console.log(Object.keys(bufs).length)
    console.log(process.memoryUsage().rss / (1024 * 1024))
}, 1000)
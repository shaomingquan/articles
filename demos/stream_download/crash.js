const bufs = {}
setInterval(() => {
    bufs[Math.random() + ''] = (new Array(550 * 1024)).fill('x')
}, 10)
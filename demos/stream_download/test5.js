const http = require('http')
const { Readable, Writable } = require('stream');
const {
    Worker, 
    isMainThread, 
    parentPort, 
    workerData // 传个查询条件
} = require('worker_threads');

const sourceFile = __dirname + '/hello-resource.js'

const getWorkerSource = () => {
    const worker = new Worker(sourceFile, {
        workerData: {
            fillChar: 'x',
            speed: 10,
        }
    })

    worker.on('message', (buffer) => {
        hooks.ondata(buffer)
    })

    worker.on('exit', () => {
        hooks.onend()
    })

    const noop = () => void 0

    const readStart = async () => {
        worker.postMessage('read')
    }

    const readStop = () => {
        console.log('pause')
        worker.postMessage('pause')
    }

    const hooks = {
        ondata: noop,
        onend: noop,
        readStart,
        readStop,
    }
    return hooks
}

class MyReadable extends Readable {
    constructor (options, source) {
        super(options)
        this._source = source

        // Every time there's data, push it into the internal buffer.
        this._source.ondata = (chunk) => {
            // If push() returns false, then stop reading from source.
            console.log('push', Date.now())

            if (!this.push(chunk))
                this._source.readStop();
        };
  
        // When the source ends, push the EOF-signaling `null` chunk.
        this._source.onend = () => {
            this.push(null);
        };
    }
    async _read () {
        console.log('read', Date.now())
        this._source.readStart()
    }
}


class MyWritable extends Writable {
    constructor(options) {
        super(options);
    }
    _write(chunk, encoding, callback) {
        console.log('write ' + chunk.toString())

        // callback();
        setTimeout(() => {
            callback();
        }, 2000)
    }
    _final(callback) {
        console.log('done')
        callback();
    }
}


const ra = new MyReadable({
    highWaterMark: 20
}, getWorkerSource());

const wa = new MyWritable({
    highWaterMark: 2
})
const oldPause = ra.pause
ra.pause = function () {
    const ctx = this;
    console.log('readable change to paused mode')
    return oldPause.call(ctx)
}
const oldResume = ra.resume
ra.resume = function () {
    const ctx = this;
    console.log('readable change to flow mode')
    return oldResume.call(ctx)
}

wa.on('drain', () => {
    console.log('writable buffer drained')
});


;(ra).pipe(wa)

// const rs = new MyReadable({
//     highWaterMark: 4
// }, getWorkerSource())

// rs.on('data', data => {
// })

// rs.on('end', () => {
//     console.log('end')
// })

// https://tech.meituan.com/2016/07/15/stream-internals.html

// push不进去了是因为reader的buffer满了，不过其实还是因为writer太慢了
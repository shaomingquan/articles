const http = require('http')
const { Readable, Writable } = require('stream');
const {
    Worker, 
    isMainThread, 
    parentPort, 
    workerData // 传个查询条件
} = require('worker_threads');

<<<<<<< HEAD
const sourceFile = __dirname + '/hello-resource-2.js'
=======
const sourceFile = __dirname + '/hello-resource.js'
>>>>>>> df5ae7e3e579eb711a8279220b44166ac17899ec

const getWorkerSource = () => {
    const worker = new Worker(sourceFile, {
        workerData: {
<<<<<<< HEAD
            fillChar: 'x'
=======
            fillChar: 'x',
            speed: 10,
>>>>>>> df5ae7e3e579eb711a8279220b44166ac17899ec
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
    constructor (options, source, req) {
        super(options)
        this._source = source
        let closed = false

        // Every time there's data, push it into the internal buffer.
        this._source.ondata = (chunk) => {
            if (closed) {
                return
            }
            // If push() returns false, then stop reading from source.
            if (!this.push(chunk))
                this._source.readStop();
        };
  
        // When the source ends, push the EOF-signaling `null` chunk.
        this._source.onend = () => {
            this.push(null);
        };

        const close = () => {
            if (closed) {
                return
            }
            closed = true
            this._source.onend()
        }
        req.on('aborted', close)
        req.on('close', close)

    }
    async _read () {
        console.log('writer reading')
        this._source.readStart()
    }
}


const server = http.createServer((req, res) => {

    const source = getWorkerSource()

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', 'attachment;filename="download.txt"')

    ;(new MyReadable(undefined, source, req)).pipe(res)
})

server.listen(6677)

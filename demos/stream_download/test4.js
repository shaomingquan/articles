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
            fillChar: 'x'
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
            if (!this.push(chunk))
                this._source.readStop();
        };
  
        // When the source ends, push the EOF-signaling `null` chunk.
        this._source.onend = () => {
            this.push(null);
        };
    }
    async _read () {
        console.log('writer reading')
        this._source.readStart()
    }
}


const server = http.createServer((req, res) => {

    const source = getWorkerSource()

    req.on('aborted', () => console.log('aborted'))
    req.on('close', () => console.log('close'))

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', 'attachment;filename="download.txt"')

    ;(new MyReadable(undefined, source)).pipe(res)
})

server.listen(6677)
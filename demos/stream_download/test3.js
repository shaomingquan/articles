const { Readable, Writable } = require('stream');

const getHelloSource = () => {
    const noop = () => void 0
    let times = 0

    const readStart = () => {
        if (times === 20) {
            return hooks.onend()
        }
        setTimeout(() => {
            times ++
            console.log('read ' + times)
            hooks.ondata(Buffer.from('' + times))
        }, 0)
    }

    const readStop = () => {
        console.log('readStop')
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
    constructor (options) {
        super(options)
        this._source = getHelloSource()

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
    _read () {
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


;(new MyReadable({
    highWaterMark: 4
})).pipe(new MyWritable({
    highWaterMark: 2
}))
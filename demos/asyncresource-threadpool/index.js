// const WorkerPool = require('./worker_pool.js');
// const os = require('os');

// const pool = new WorkerPool(os.cpus().length);

// let finished = 0;
// for (let i = 0; i < 10; i++) {
//   pool.runTask({ a: 42, b: 100 }, (err, result) => {
//     console.log(i, err, result);
//     if (++finished === 10)
//       pool.close();
//   });
// }

// var v8 = require('v8')

// var arr = []
// for (var i = 0 ; i < 5e6 ; i ++) {
//     arr.push(i)
// }

// var sum = key => heapSpaceStatistics.reduce((ret, current) => {
//     return ret + current[key]
// }, 0)
// var heapSpaceStatistics = v8.getHeapSpaceStatistics()
// var heapCodeStatistics = v8.getHeapCodeStatistics()
// var memoryUsage = process.memoryUsage()
// console.log(
//     heapSpaceStatistics,
//     heapCodeStatistics,
//     memoryUsage,
//     sum('space_size'), // 这个总量就是heapTotal
//     sum('space_used_size'), // 这个总量就是heapUsed
//     heapCodeStatistics.external_script_source_size + memoryUsage.arrayBuffers,
//     memoryUsage.external
// );

const buf = Buffer.alloc(+process.argv[2] * 1024 * 1024, 'x')
console.log(Math.round(buf.length / (1024 * 1024)))
console.log(Math.round(process.memoryUsage().rss / (1024 * 1024)))
var pidusage = require('pidusage')

pidusage(process.pid, function (err, stats) {
  console.log(stats)
})
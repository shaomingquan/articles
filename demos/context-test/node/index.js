const vm = require('vm')

const ctx = vm.createContext({})

const start = Date.now()
console.log('a', Date.now() - start)
vm.runInContext(`
    const start = Date.now();
    while (Date.now() - start < 5000) {}
`, ctx)
console.log('b', Date.now() - start)

/**

符合预期，context会互相阻塞

 */
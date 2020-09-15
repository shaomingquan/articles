module.exports = function (obj) {
    const constructorList = []
    while(obj.constructor.name !== 'Object') {
        obj = Object.getPrototypeOf(obj)
        constructorList.push(obj.constructor.name)
    }
    return constructorList.join(' -> ')
}
const _ = require('lodash')
const versions = [4, 6, 8, 10, 12, 14, 16]
const menus = versions.reduce((ret, v) => ({
    ...ret, 
    [ v ]: require('./doc-menus/v' + v +'.js').
        map(menu => menu.toLowerCase())
}), {})
let from = 0
for ( ; from < versions.length - 1 ; from ++) {
    const fromMenu = menus[versions[from]]
    const toMenu = menus[versions[from + 1]]
    const adds = _.difference(toMenu, fromMenu)
    const removes = _.difference(fromMenu, toMenu)

    console.log(`from v${versions[from]} to v${versions[from + 1]}\n`)
    console.log(`add:    \n${adds.join('\n')}\n`)
    console.log(`remove: \n${removes.join('\n')}\n`)
    console.log(`-------------------------------------------\n`)
}
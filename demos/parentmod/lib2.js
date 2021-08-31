const parentModule = require('parent-module');
module.exports = () => {
    console.log(module.parent.filename)
    console.log(parentModule())
}
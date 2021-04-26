// var arr = ['', '', '', 97]
// arr[0] = 100
// arr[1] = 99
// arr[2] = 98
var arr = [100, 99, 98, 97]
// var arr2 = new Int32Array(arr)
var arr2 = new Int32Array(4)
arr2[0] = 100
arr2[1] = 99
arr2[2] = 98
arr2[3] = 97

console.time('v8 arr bit-multiple:')
for (var i = 1 ; i < 100000000 ; i ++) {
    for (var j = 0 ; j < arr.length ; j ++) {
       arr[j] = i | arr[j]
    }
}
console.timeEnd('v8 arr bit-multiple:')


console.time('native arr bit-multiple:')
for (var i = 1 ; i < 100000000 ; i ++) {
    for (var j = 0 ; j < arr2.length ; j ++) {
       arr2[j] = i | arr2[j]
    }
}
console.timeEnd('native arr bit-multiple:')


console.log(arr)
console.log(arr2)

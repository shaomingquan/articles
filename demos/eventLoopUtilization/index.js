'use strict';
const { eventLoopUtilization } = require('perf_hooks').performance;
const { spawnSync, spawn } = require('child_process');

const syncBlock = ms => {
    const start = Date.now()
    while(Date.now() - start < ms) {}
}


const asyncBlock = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

setImmediate(async () => {
    const elu1 = eventLoopUtilization();
    console.log(elu1);

    await syncBlock(2000)

    const elu2 = eventLoopUtilization();
    console.log(elu2);

    console.log(eventLoopUtilization(elu2, elu1));
});
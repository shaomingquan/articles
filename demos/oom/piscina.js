'use strict';

const Piscina = require('piscina');
const { resolve } = require('path');
const { strictEqual } = require('assert');

const piscina = new Piscina({
  filename: resolve(__dirname, 'pworker.js'),
  resourceLimits: {
    maxOldGenerationSizeMb: 16,
    maxYoungGenerationSizeMb: 4,
    codeRangeSizeMb: 16
  }
});

// 一个worker pool实现，依然没有解决覆盖问题

(async function () {
  try {
    console.time('__')
    await piscina.runTask();
} catch (err) {
    console.timeEnd('__')
    console.log('Worker terminated due to resource limits');
    strictEqual(err.code, 'ERR_WORKER_OUT_OF_MEMORY');
  }
})();
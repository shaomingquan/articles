import cluster from 'cluster';
import http from 'http';
import net from 'net'
import { cpus } from 'os';
import process from 'process';
import fs from 'fs'

const numCPUs = cpus().length;

if (cluster.isMaster) {
  console.log(`Primary ${process.pid} is running`);

  // 衍生工作进程。
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // 工作进程可以共享任何 TCP 连接
  // 在本示例中，其是 HTTP 服务器
  net.createServer((socket) => {
    socket.on('data', (data) => {
      console.log(data.toString())
    })
    console.log(socket._handle, process.pid, cluster.isMaster)
    socket.end('goodbye\n');
  }).listen(8124, () => {
      console.log('~')
  });

  console.log(`Worker ${process.pid} started`);
}
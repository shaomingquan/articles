import net from 'net'
const client = net.createConnection({ port: 8124 }, () => {
  // 'connect' 监听器。
  console.log('connected to server!');
  client.write('world!\r\n');
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
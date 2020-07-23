var express = require('express');
var path = require('path');
// const WebSocket = require('ws');
const WS = require('ws');

var app = express();

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(path.resolve() + '/dist/index.html'));
});

app.use('/dist', express.static(
  path.join(path.resolve() + '/dist')));

app.use('/img', express.static(
  path.join(path.resolve() + '/img')));

console.log(path.resolve() + '/dist');
app.listen(8080);

const wss = new WS.Server({ port: 8081 });
 
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
 
  ws.send('something');
});
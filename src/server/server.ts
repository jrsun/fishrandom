import express from  'express';
import path from 'path';

var app = express();

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(path.resolve() + '/src/index.html'));
});

app.use('/build/ui', express.static(
  path.join(path.resolve() + '/build/ui')));

app.listen(8080);
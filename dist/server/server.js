var express = require('express');
var path = require('path');
var app = express();
// viewed at http://localhost:8080
app.get('/', function (req, res) {
    res.sendFile(path.join(path.resolve() + '/dist/index.html'));
});
app.use('/dist', express.static(path.join(path.resolve() + '/dist')));
console.log(path.resolve() + '/dist');
app.listen(8080);
//# sourceMappingURL=server.js.map
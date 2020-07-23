import express from 'express';
import path from 'path';

const app = new express();
const port = 3000;
const __dirname = path.resolve();

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: '.'});
})

app.use('/ui', express.static(path.join(__dirname,'build/ui')));

// Start the server on port 3000
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
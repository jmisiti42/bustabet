const   cors = require('cors'),
        express = require('express'),
        fs = require('fs'),
        https = require('https'),
        bodyParser = require('body-parser'),
        path = require('path'),
        PORT = 80,
        app = express();

const httpsOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt')),
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
}

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
  
app.post('/rashpalsingh', function (req, res) {
  console.log('rashpalsingh');
  console.table(req.body);
  res.send({ success: true });
})

app.get('/test', (req, res) => {
  res.send('ok');
});

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Listening ${PORT}`)
})

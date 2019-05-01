const   cors = require('cors'),
        express = require('express'),
        http = require('http'),
        bodyParser = require('body-parser'),
        PORT = 3300,
        app = express(),
        server = http.createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
  
app.post('/rashpalsingh', function (req, res) {
  console.log('rashpalsingh');
  console.table(req.body);
  res.send({ success: true });
})

server.listen(PORT, function () {
  console.log('Example app listening on port 3300!')
})

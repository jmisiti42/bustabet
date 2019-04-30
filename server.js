const express = require('express');
const app = express();

// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     next();
// });
  
app.post('/', function (req, res) {
  res.send({ success: true });
})

app.listen(3300, function () {
  console.log('Example app listening on port 3300!')
})

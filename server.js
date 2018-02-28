var express = require('express');
var app = express();
var port = process.env.PORT || 80;
var compression = require('compression')
var csv = require('fast-csv');
var fs = require('fs');
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
app.use(compression())
console.log(process.env);
app.use(express.static(__dirname + '/wwwroot'));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());
app.get('/', function (req, res) {
  res.sendFile('public/index.html', { root: __dirname });
});
app.get('/process', function (req, res) {
  var dictionary = [];
  var stream = fs.createReadStream("public/libs/coinbaseUSDs.csv");
  var csvStream = csv()
    .on("data", function (data) {
      dictionary[data[0]] = data[1];
    })
    .on("end", function () {
      var csvStream = csv.createWriteStream({ headers: false }),
        writableStream = fs.createWriteStream("public/libs/reduced.csv");
      writableStream.on("finish", function () {
        console.log("DONE!");
      });
      csvStream.pipe(writableStream);
      for (var key in dictionary) {
        if (dictionary.hasOwnProperty(key))
          csvStream.write({ a: key, b: dictionary[key] });
      }
      csvStream.end();
    });

  stream.pipe(csvStream);

});
app.get('/data', function (req, res) {


  var startDate = new Date();
  startDate.setHours(startDate.getHours() + 200);
  var result = [];
  for (var i = 0; i < 1000; i++) {


    result.push(Math.floor(startDate.getTime() / 1000));


    startDate.setHours(startDate.getHours() - 1);
  }
  var csvStream = csv.createWriteStream({ headers: false }),
    writableStream = fs.createWriteStream("public/libs/predictables.csv");
  writableStream.on("finish", function () {
    console.log("DONE!");
  });
  csvStream.pipe(writableStream);
  result.forEach(function (e) {
    csvStream.write({ a: e });

  });
  csvStream.end();




// var credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
// AWS.config.credentials = credentials;

// var machinelearning = new AWS.MachineLearning();
// var aa= 1;

  // var dictionary = [];
  // var stream = fs.createReadStream("public/libs/reduced.csv");
  // var csvStream = csv()
  //   .on("data", function (data) {
  //     dictionary[data[0]] = data[1];
  //   })
  //   .on("end", function () {

  //   });

  // stream.pipe(csvStream);



  // var http = require("http");
  // url = "  ";

  // var startDate = new Date();

  // for (var i = 0; i < 10; i++) {
  //   var callTime = Math.floor(startDate.getTime() / 1000);

  //   var request = http.get(url, function (response) {
  //     var buffer = "",
  //       data,
  //       route;

  //     response.on("data", function (chunk) {
  //       buffer += chunk;
  //     });

  //     response.on("end", function (err) {

  //       console.log(buffer);
  //       console.log("\n");
  //       data = JSON.parse(buffer);
  //       route = data;

  //     });
  //   });
  //   startDate.setHours(startDate.getHours()-1);

  // }


});


var server = require('http').createServer(app);
server.listen(port);
console.log("App listening on port " + port);

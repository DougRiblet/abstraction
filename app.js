var express  = require('express');
var path     = require('path');
var http     = require('http');
var request  = require('request');
var mongoose = require('mongoose');

var app      = express();
var port     = process.env.PORT || 8010;

if(!process.env.MONGODB_URI){
  var uri = require( './uri' ).uri;
} else {
  var uri = process.env.MONGODB_URI;
}

if(!process.env.API_KEY){
  var key = require( './key' ).key;
} else {
  var key = process.env.API_KEY;
}

mongoose.connect(uri);

// ENDPOINTS

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/favicon.ico', function(req, res) {
  res.sendStatus(200);
});

app.get('/search/*', function(req, res) {
  var offset, submit = req.url.slice(8);
  if(submit.indexOf("?")>=0){
    var cutoff = submit.indexOf("?");
    var addon = submit.slice(cutoff);
    submit = submit.slice(0,cutoff);
    var offsetTest = /^\?offset=/i;
    if (offsetTest.test(addon)){
      offset = 10*(parseInt(addon.replace("?offset=",""))-1)+1;
    }
  }

  var api1 = "https://www.googleapis.com/customsearch/v1?q=";
  var api2 = "&cx=008521943856454278517%3Anc2w6ux1uqq";
  var api3 = "&searchType=image&fields=items(formattedUrl%2Cimage(contextLink%2CthumbnailLink)%2Clink%2Csnippet)"
  var url = api1 + submit + api2 + api3 + "&key=" + key;
  if (offset){
    url = url + "&start=" + offset;
  } 

  request(url, function (error, response, body) {
    if (error) {
      console.log("request error: ", error);
      res.send("Error with request");
    }
    if (!error && response.statusCode == 200) {
      var output = JSON.parse(body).items.map(function(item){
        var newItem = {};
        newItem.image = item.link;
        newItem.thumbnail = item.image.thumbnailLink;
        newItem.caption = item.snippet;
        newItem.page = item.image.contextLink;
        return newItem;
      });

      res.json(output);
    }
  })
});

app.get('/recent', function(req, res) {

});

app.use(function(req, res, next) {
  res.status(404).send('Error 404');
});

// DATABASE

var phraseSchema = mongoose.Schema({
  search_term: String,
  search_date: Date
});
var Phrase = mongoose.model('Phrase', phraseSchema);

// Connection Events

mongoose.connection.on('connected', function(){
  console.log('Mongoose db connection established with uri:' + uri + "===");
})

mongoose.connection.on('error', function(err){
  console.error('Error with mongoose db connection: ' + err + "===");
})

mongoose.connection.on('disconnected', function(){
  console.log('Mongoose db has been disconnected.');
})

// SERVER

app.listen(port, function () {
  console.log('Image Search app listening on port ' + port);
});

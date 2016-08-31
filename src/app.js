// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);
// var fetch = require('node-fetch');
// fetch.Promise = require('promise');
// var FormData = require('form-data');
//
//
// app.get('/', function(req, res){
//   res.sendfile('index.html');
// });
//
// io.on('connection', function(socket){
//   console.log('a user connected');
// });
//
// http.listen(3000, function(){
//   console.log('listening on *:3000');
// });
//
// io.on('connection', function(socket){
//   console.log('a user connected');
//   socket.on('disconnect', function(){
//     console.log('user disconnected');
//   });
// });
//
// io.on('connection', function(socket){
//   socket.on('chat message', function(msg){
//     console.log('message: ' + msg);
//   });
// });
//
// io.emit('some event', { for: 'everyone' });
//
// io.on('connection', function(socket){
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg);
//   });
// });
//////////////////// USGS API Call ////////////////////////
var lastTime = 0;
var quakeTimer;

function render() {
	console.log('render');
  clearTimeout(quakeTimer);
  console.log('clearTimer')
  getQuakes();
}

function vibrateSense(magnitude, location){

	console.log('in vibrateSense')
	// this data is sent to the Particle Electron
	// Code is stopping here
	var form = new FormData();
	form.append('args','on');
	// form.append('value','off');
	console.log('form --> ' + JSON.stringify(form))

	fetch('https://api.particle.io/v1/devices/260044001951353338363036/led?access_token=28a267c1cb56bdbe8524907441b5b1ff0c92d2ca', { method: 'POST', body: form})
    .then(function(res) {
        return res.json();
    })
		.then(function(json) {
        console.log(json);
    });
}

function getQuakes() {
	fetch('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
    .then(function(res) {
			return res.json();
		})
		.then(function(data) {
      var mostRecentQuake = getMostRecentQuake(data)

      if(mostRecentQuake.time > lastTime && mostRecentQuake.magnitude > 1) {
        lastTime = mostRecentQuake.time;
        console.log('There is a new quake! Its magnitude is ' + mostRecentQuake.magnitude.toString());
        vibrateSense(scaleMagnitudeToMilliseconds(mostRecentQuake.magnitude), mostRecentQuake.place);
        render();
      }

    	quakeTimer = setTimeout(function(){ getQuakes(); }, 1000);
    });
}

function getMostRecentQuake(data) {
  if (data.features.length > 0) {
  var properties = data.features[0].properties;
    return {
      "time" : properties.time,
      "magnitude" : properties.mag,
      "place" : properties.place
    }
  } else {
    return {}
  }
}

function scaleMagnitudeToMilliseconds(magnitude) {
  var richterMax = 12;
  var richterMin = 1;
  var milliMax = 3000;
  var milliMin = 500;

  var scaledMagnitude = ((milliMax - milliMin)/(richterMax - richterMin)) * (magnitude - richterMax) + milliMax;
  return Math.abs(Math.round(scaledMagnitude));
}

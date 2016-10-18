var dotenv = require('dotenv');
var express = require('express');
require('es6-promise').polyfill();
require('isomorphic-fetch');
var formData = require('form-data');
var http = require('http');

var app = express();
var port =  process.env.PORT || 5000;
var port_number = server.listen(process.env.PORT || 3000);
var quakeTimer;
var lastRecordedQuakeTime = 0;
// Checking to see if this function is needed when app defined as worker on Heroku
setInterval(function() {
    http.get("http://seismic-server.herokuapp.com");
}, 300000)

var server = http.createServer(function(request, response) {
  var filePath = false;

  if (request.url == '/') {
    filePath = "../public/index.html";
  } else {
    filePath = "../public" + request.url;
  }

  var absPath = "./" + filePath;
  serverWorking(response, absPath);
});

app.listen(port, function() {
  console.log('Server running on ' + port);
  dotenv.load();
  start();
});

function start() {
  console.log('start monitoring')
  checkForQuakes();
}

function stop() {
  clearTimeout(quakeTimer);
}

function checkForQuakes() {
  loadMostRecentQuake()
  .then(loadDistanceToQuake)
  .then(triggerSense);

  quakeTimer = setTimeout(function(){ checkForQuakes(); }, 1000);
}

function loadMostRecentQuake() {
  // console.log('Load USGS Data');
	return fetch('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
    .then(function(res) {
			return res.json();
		})
		.then(function(data) {
      return data.features[0].properties;
    })
}

function loadDistanceToQuake(mostRecentQuake) {
  quakeLocation = mostRecentQuake.place.split(' ').join('+');

  return fetch('https://maps.googleapis.com/maps/api/distancematrix/json?origins='+quakeLocation+'&destinations=New+York,New+York&key='+process.env.GOOGLE_MAPS_API_KEY)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    mostRecentQuake.distance = data.rows[0].elements[0].distance.value;
    return mostRecentQuake;
  })
}

function triggerSense(mostRecentQuake){
  if(mostRecentQuake.time > lastRecordedQuakeTime && mostRecentQuake.mag > 1) {
    lastRecordedQuakeTime = mostRecentQuake.time;
    var scaledMagnitude = scaleMagnitude(mostRecentQuake.mag);
    var scaledDistanceToQuake = scaleDistance(mostRecentQuake.distance);
    console.log("MAGNITUDE: " + mostRecentQuake.mag)
    console.log(" DISTANCE: " + mostRecentQuake.distance/1000);
    console.log("SCALED MAGNITUDE: " + scaledMagnitude);
    console.log("SCALED DISTANCE: " + scaledDistanceToQuake);
    vibrateSense(scaledMagnitude, scaledDistanceToQuake);
  }
}

function vibrateSense(magnitude, distance) {
  console.log('sending data')
  var concatValues = magnitude+'n'+distance;
  console.log('concatValues: ', concatValues);
  var form = new formData();
  form.append('args',concatValues);

  fetch('https://api.particle.io/v1/devices/'+process.env.DEVICE_KEY+'/data?access_token='+process.env.PARTICLE_TOKEN, { method: 'POST', body: form})
    .then(function(res) {
        return res.json();
    })
    .then(function(json) {
        console.log(json);
  });
}

function scaleDistance(distance) {
  var distanceMax = 20038000;
  var distanceMin = 0;
  var newMax = 135;
  var newMin = 0;
  var scaledDistance = (distance - distanceMin) * (newMax - newMin) / (distanceMax - distanceMin) + newMin;  
  // var scaledDistance = (newMax/distanceMax) * (distance - distanceMax) + newMax;
  return Math.abs(Math.round(scaledDistance));
}

function scaleMagnitude(magnitude) {
  var richterMax = 10;
  var richterMin = 1;
  var newMax = 4000;
  var newMin = 200;

  var scaledMagnitude = ((newMax - newMin)/(richterMax - richterMin)) * (magnitude - richterMax) + newMax;
  return Math.abs(Math.round(scaledMagnitude));
}

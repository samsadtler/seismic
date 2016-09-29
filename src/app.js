var dotenv = require('dotenv');
// dotenv.config({path: '.env'});
// dotenv.connect({
//   host: process.env.LOCALHOST
// });
var express = require('express');
var app = express();

// configuration of port, templates (/views), static files (/public)
// and other expressjs settings for the web server.

// server port number
app.listen('port', process.env.PORT || 5000);
require('es6-promise').polyfill();
require('isomorphic-fetch');

dotenv.load();
var FormData = require('form-data');

var quakeTimer;
var lastRecordedQuakeTime = 0;

function start() {
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
  console.log('load');
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
  var form = new FormData();
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
  var newMax = 255;

  var scaledDistance = (newMax/distanceMax) * (distance - distanceMax) + newMax;
  return Math.abs(Math.round(scaledDistance));
}

function scaleMagnitude(magnitude) {
  var richterMax = 10;
  var richterMin = 1;
  var newMax = 65535;
  var newMin = 1;
  function map( x,  in_min,  in_max,  out_min,  out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}



  var scaledMagnitude = ((newMax - newMin)/(richterMax - richterMin)) * (magnitude - richterMax) + newMax;
  return Math.abs(Math.round(scaledMagnitude));
}

start();

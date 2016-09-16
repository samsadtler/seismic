var dotenv = require('dotenv');
dotenv.load();
require('es6-promise').polyfill();
require('isomorphic-fetch');

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
    console.log("SCALED MAGNITUDE: " + scaledMagnitude);
    console.log("SCALED DISTANCE: " + scaledDistanceToQuake);
    vibrateSense(scaledMagnitude, scaledDistanceToQuake);
  }
}

function vibrateSense(magnitude, distance) {
  var concatValues = magnitude+'n'+distance
  var form = new FormData();
  form.append('args','concatValues');

  fetch('https://api.particle.io/v1/devices/'+process.env.DEVICE_KEY+'/led?access_token='+process.env.PARTICLE_TOKEN, { method: 'POST', body: form})
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
  var richterMax = 12;
  var richterMin = 1;
  var newMax = 3000;
  var newMin = 500;

  var scaledMagnitude = ((newMax - newMin)/(richterMax - richterMin)) * (magnitude - richterMax) + newMax;
  return Math.abs(Math.round(scaledMagnitude));
}

start();
stop();

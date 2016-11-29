var dotenv = require('dotenv');
var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var formData = require('form-data');
var http = require('http');
require('es6-promise').polyfill();
require('isomorphic-fetch');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

var port = process.env.PORT || 4000;
var quakeTimer;
var lastRecordedQuakeTime = 0;
var recentLocation = {};

setInterval(function() {
  http.get("http://seismic-server.herokuapp.com");
}, 1500000);

app.listen(port, function() {
  log('Server running on port ' + port);
  dotenv.load();
  checkForQuakes();
});

app.get('/',function(req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.post('/api/location', function(req, res) {
  res.send('POST request to the homepage');
  log('location requested');
  log(req.body);
});

function checkForQuakes() {
  fetchNewQuakeData().then(function(quakeData) {
    if(shouldTriggerSense(quakeData)){
      loadDistanceTo(quakeData)
        .then(triggerSense);
    }
  });
  quakeTimer = setTimeout(function() { checkForQuakes(); }, 1000);
}

function shouldTriggerSense(quakeData) {
  var isNewQuake = quakeData.time > lastRecordedQuakeTime;
  var isHighMagnitude = quakeData.mag > 1;
  var shouldTrigger = isNewQuake && isHighMagnitude;

  if(shouldTrigger) {
    lastRecordedQuakeTime = quakeData.time;
  }
  return shouldTrigger;
}

function fetchNewQuakeData() {
  return fetch('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
    .then(function(response) {
      return response.json();
    }, function(error) {
      logError(error);
    })
    .then(function(json) {
      return json.features[0].properties;
    });
}

function loadDistanceTo(quakeData) {
  //TODO: refactor this method
  //maximum number of api request 2500/day
  quakeLocation = quakeData.place.split(' ').join('+');

  return fetch('https://maps.googleapis.com/maps/api/distancematrix/json?origins='+quakeLocation+'&destinations=New+York,New+York&key='+process.env.GOOGLE_MAPS_API_KEY)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    quakeData.distance = 400000;
    //faking distance until the google maps api chills
    //mostRecentQuake.distance = data.rows[0].elements[0].distance.value;
    return quakeData;
  });
}

function triggerSense(quakeData) {
  var magnitude = scaleMagnitude(quakeData.mag);
  var distance = scaleDistance(quakeData.distance);
  logShouldVibrate(quakeData, magnitude, distance);

  var concatValues = magnitude + 'n' + distance;
  log('Sending vibration command with values: ' + concatValues);
  sendToParticle(concatValues);
}

function sendToPartcile(concatValues) {
  var form = new formData();
  form.append('args', concatValues);

  fetch('https://api.particle.io/v1/devices/'+process.env.DEVICE_KEY+'/data?access_token='+process.env.PARTICLE_TOKEN, { method: 'POST', body: form})
    .then(function(res) {
      return res.json();
    })
    .then(function(json) {
      log('Response received: ');
      log(json);
    });
}

function scaleDistance(distance) {
  var distanceMax = 20038000;
  var distanceMin = 0;
  var newMax = 135;
  var newMin = 0;
  var scaledDistance = (distance - distanceMin) * (newMax - newMin) / (distanceMax - distanceMin) + newMin;  
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

function log(message) {
  console.log(message);
}

function logError(error) {
  console.log("Encountered an error:");
  console.log(error);
}

function logShouldVibrate(quakeData, scaledMagnitude, scaledDistance) {
  console.log("Vibration triggered with values:");
  console.log(" -> magnitude:        " + quakeData.mag);
  console.log(" -> distance:         " + quakeData.distance);
  console.log(" -> scaled magnitude: " + scaledMagnitude);
  console.log(" -> scaled distance:  " + scaledDistance);
}
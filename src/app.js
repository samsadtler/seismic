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
  log('Sending keep-alive GET request to heroku')
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
  log('New cell tower info received from seismic sense:');
  log(req.body);
  loadCellTowerLocation(req.body);
});

function checkForQuakes() {
  fetchNewQuakeData().then(function(quakeData) {
    if(shouldTriggerSense(quakeData)){
      loadDistance(quakeData).then(function(quakeData) {
        if(quakeData == null) {
          log('Error discovered. Cancel triggering sense.')
        } else {
          triggerSense(quakeData)
        }
      });
    }
  });
  quakeTimer = setTimeout(function() { checkForQuakes(); }, 1000);
}

function shouldTriggerSense(quakeData) {
  var isNewQuake = quakeData.time > lastRecordedQuakeTime;
  var isHighMagnitude = quakeData.mag > 1;
  var shouldTrigger = isNewQuake && isHighMagnitude;

  if(shouldTrigger) {
    log('Encountered USGS seismic event which should trigger sense');
    lastRecordedQuakeTime = quakeData.time;
  }
  return shouldTrigger;
}

function fetchNewQuakeData() {
  var url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
  return fetchJson(url, function(json) {
    return json.features[0].properties;
  });
}

function loadDistance(quakeData) {
  log('Loading distance from Google Maps API...');
  quakeLocation = quakeData.place.split(' ').join('+');
  var url = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='+quakeLocation+'&destinations=New+York,New+York&key='+process.env.GOOGLE_MAPS_API_KEY;
  return fetchJson(url, function(json) {
    if(responseHasErrors(json)){
      logError(json.error_message);
      return null;
    }
    quakeData.distance = json.rows[0].elements[0].distance.value;
    log('Distance found: ' + quakeData.distance);
    return quakeData;
  });
}

function loadCellTowerLocation(cellTowerData) {
  log('Loading distance from Google Geolocation API...');
  var url = 'https://www.googleapis.com/geolocation/v1/geolocate?key='+process.env.GOOGLE_GEOLOCATION_API_KEY;
  fetch(url,{method: 'POST' , body: cellTowerData})
    .then(function(res) {
      log('Geolocation Response: ');
      log(res);
    });
  
}

function responseHasErrors(json) {
  return json.status != 'OK';
}

function triggerSense(quakeData) {
  var magnitude = scaleMagnitude(quakeData.mag);
  var distance = scaleDistance(quakeData.distance);
  logShouldVibrate(quakeData, magnitude, distance);

  var concatValues = magnitude + 'n' + distance;
  log('Sending vibration command to seismic sense with values: ' + concatValues);
  sendToParticle(concatValues);
}

function sendToParticle(concatValues) {
  var form = new formData();
  form.append('args', concatValues);

  fetch('https://api.particle.io/v1/devices/'+process.env.DEVICE_KEY+'/data?access_token='+process.env.PARTICLE_TOKEN, { method: 'POST', body: form})
    .then(function(res) {
      return res.json();
    })
    .then(function(json) {
      log('Response received from seismic sense: ');
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

function fetchJson(url, handler) {
  return fetch(url)
    .then(function(response) {
      return response.json();
    }, function(error) {
      logError(error);
    })
    .then(handler, function(error) {
      logError(error);
    });
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
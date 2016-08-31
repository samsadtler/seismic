var lastTime = 0;
var quakeTimer;

function start() {
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

	fetch('https://api.particle.io/v1/devices/'+process.env.DEVICE_KEY+'/led?access_token='+process.env.PARTICLE_TOKEN, { method: 'POST', body: form})
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
        var scaledMagnitude = scaleMagnitude(mostRecentQuake.magnitude);
        var scaledDistanceToQuake = getScaledDistanceToQuake(mostRecentQuake.place, 'New+York,New+York');
        vibrateSense(scaledMagnitude, scaledDistanceToQuake);
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

function getScaledDistanceToQuake(quakeAddress, deviceAddress) {
  quakeAddress = quakeAddress.split(' ').join('+');
  fetch('https://maps.googleapis.com/maps/api/geocode/json?origins='+quakeAddress+'&destinations='+deviceAddress+'&key='+process.env.GOOGLE_MAPS_API_KEY)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    scaleDistance(data.rows[0].elements[0].distance.value);
  })
}

function scaleDistance(distance) {
  var distanceMax = 20038000;
  var scaleMax = 255;

  var scaledDistance = (scaleMax/distanceMax) * (distance - distanceMax) + scaleMax;
  return Math.abs(Math.round(scaledDistance));
}

function scaleMagnitude(magnitude) {
  var richterMax = 12;
  var richterMin = 1;
  var milliMax = 3000;
  var milliMin = 500;

  var scaledMagnitude = ((milliMax - milliMin)/(richterMax - richterMin)) * (magnitude - richterMax) + milliMax;
  return Math.abs(Math.round(scaledMagnitude));
}

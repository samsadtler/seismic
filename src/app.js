var quakeTimer;

function start() {
  checkForQuakes(0);
}

function stop() {
  clearTimeout(quakeTimer);
}

function checkForQuakes(lastTime) {
  var mostRecentQuake = getMostRecentQuake();

  if(mostRecentQuake.time > lastTime && mostRecentQuake.mag > 1) {
    lastTime = mostRecentQuake.time;
    var scaledMagnitude = scaleMagnitude(mostRecentQuake.mag);
    var scaledDistanceToQuake = scaleDistance(getDistanceToQuake(mostRecentQuake.place, 'New+York,New+York'));
    vibrateSense(scaledMagnitude, scaledDistanceToQuake);
  }

  quakeTimer = setTimeout(function(){ checkForQuakes(lastTime); }, 1000);
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

function getMostRecentQuake() {
	fetch('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
    .then(function(res) {
			return res.json();
		})
		.then(function(data) {
      return data.features[0].properties;
    });
}

function getDistanceToQuake(quakeAddress, deviceAddress) {
  quakeAddress = quakeAddress.split(' ').join('+');
  fetch('https://maps.googleapis.com/maps/api/geocode/json?origins='+quakeAddress+'&destinations='+deviceAddress+'&key='+process.env.GOOGLE_MAPS_API_KEY)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    return data.rows[0].elements[0].distance.value;
  })
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

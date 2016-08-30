var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fetch = require('node-fetch');
fetch.Promise = require('promise');
var FormData = require('form-data');


app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});

io.emit('some event', { for: 'everyone' });

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});
//////////////////// USGS API Call ////////////////////////
var lastTime = 0,
    newTime = 0,
    magnitude,
    place;

var refreshTime = 1;
var quakeTimer;

function render() {
	console.log('render');
  if(refreshTime == 1) {
   clearTimeout(quakeTimer);
   console.log('clearTimer')
   getQuakes();
  };
};

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
};

function getQuakes() {
	fetch('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
    .then(function(res) {
			return res.json();
		})
		.then(function(data) {
      for(var i = 0; i < data.features.length; i++){
        var properties = data.features[i].properties;
        var time = properties.time;
        if(time > newTime){
         	newTime = time;
         	magnitude = properties.mag;
         	place = properties.place;
         	console.log('time: ',newTime," magnitude: ", magnitude, " place: ", place);
        }
      }

      if(newTime > lastTime) {
        lastTime = newTime;
        console.log('There is a new quake! Its magnitude is ' + magnitude.toString());
       	vibrateSense(magnitude, place);
        // render();
      }

    	quakeTimer = setTimeout(function(){
        getQuakes();
      }, refreshTime * 1000);
    })
}

setTimeout(function(){
  getQuakes();
}, 2000);

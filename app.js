var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fetch = require('node-fetch');
fetch.Promise = require('promise');


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

var refreshTime = 5;
var quakeTimer;

function again(times){
	console.log('maybe this is a good time to send a signal to the particle')
  if(times > 0) {
    ui.Vibe.vibrate('short');
    setTimeout(function(){
      again(times - 1);
    }, 1500);
  }
};

function getQuakes() {
fetch('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
    .then(function(res) {
        return res.json();
    }).then(function(data) {

        console.log("Got new quake information.");
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
      console.log(newTime, lastTime);
      if(newTime > lastTime) {
        lastTime = newTime;
        console.log('There is a new quake! Its magnitude is ' + magnitude.toString());
        vibrateTimes(Math.round(magnitude));
        main.body = magnitude.toString();
        render();
      }
      quakeTimer = setTimeout(function(){
        getQuakes();
      }, refreshTime * 60000);
    })
}

function render() {
  if(refreshTime == 1) {
   clearTimeout(quakeTimer);
   console.log('clearTimer')
   getQuakes();
   render();
  };
};


setTimeout(function(){
  getQuakes();
}, 2000);
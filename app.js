http = require('http'); //INCLUDE HTTP SINCE ITS GONA B A HTTP SERVER
express = require('express'); //EXPRESS FRAMEWORK FOR THE ROUTING ETC
var app = express();
var server = http.createServer(app); //CREATE SERVER
server.listen(3000); //SERVER LISTENING TO 3000 PORT NUMBER

var io = require('socket.io').listen(server); //CREARTE A SOCKET VARIABLE
var twit=require('twitter'); //INCLUDE TWITTER MODULE
var twitter=new twit({consumer_key: 'xNDR92LFCFJoH0PHlBPB5yZFj',
  consumer_secret: 'qnyMI2ELlFYT0K3xxlCWYU30MWdqRqrWW1WJl7nK5yf1DMCsPV',
  access_token_key: '100713827-Eklc7UTh3TWwbcDiNsRB9Ya2VjLxkh91MhdX8HuA',
  access_token_secret: 'yKCJYr3wGiYx2bN0vwcH9RmcZRebdsSesziaR6LbTOmdZ'});
//USE API KEYS
var count=0;//VARIBALE JUST TO LOG THE COUNTS ON THE CONSOLE 

app.get('/',function(req,res){
  res.sendFile(__dirname+'/index.html');
}); //INDEX VIEW

  //UPON CONNECTION..JUST KEEP NOTING THE CALLBACKS..
io.on("connection",function(socket)
  {
    console.log("found client...");
     //TO RESTART WHEN THE CONNECTION CEASES//OR DUE TO ERROR IF IT STOPS
    socket.on("restart",function(){ 
      console.log("connecting to tweeter api,,,");
      //THE MEAT OF THE TWITTER API(CHANGE THE TRACK FOR DIFFRENT WORD FILTER)
      twitter.stream('statuses/filter', {'track': 'gis1234gis'}, function(stream) {  
         //On recieving Data
        stream.on('data', function(data) {
           console.log(data.text);//JUST LOG THE TWEETS ON THE SERVER CONSOLE
            if (data.coordinates != null){
                //JUST PASS THE COORDINATES TO THE VIEW VIA A JSON OBJECT
                var outputPoint = {"lng": data.coordinates.coordinates[0],"lat": data.coordinates.coordinates[1],"sen": data.text};
                count+=1;
                console.log("Count:",count,"Location: ",outputPoint);
                //LOG THE COUNT AND LOCATION
                //SEND TO THE VIEW
                socket.emit("coordinates", outputPoint);
            }
            else if(data.place!=null){  //THEN FIND THE COORDINATES OF THE BOX THE PLACE ASSOCITED WITH AND THE CENTER OF THE BOX APPROXIMATES THE LOCATION
              console.log("its a place"); //JUST FOR DEBUGGING PURPOSE
              if(data.place.bounding_box.type == 'Polygon'){
                console.log("polygon block");
                // TO FIND CENTER OF THE BOX
                var coords=data.place.bounding_box.coordinates;
                var coord, _i, _len;
                var centerLat = 0;
                var centerLng = 0;

                for (_i = 0, _len = coords.length; _i < _len; _i++) {
                  coord = coords[0][_i];
                  centerLat += coord[1];
                  centerLng += coord[0];
                }

                centerLat = (centerLat / coords.length)+1.42457949;
                centerLng = (centerLng / coords.length)+.07443353+.6699;

                var outputPoint = {"lng": centerLng,"lat": centerLat,"sen": data.text};

               //CREATE AND EMIT THE JSON OBJECT OUTPUTPOINT

               socket.emit('coordinates', outputPoint);
              
              }
            }            

      });  //END STREAM.ON DATA

      //THE ERROR AND DISCREPANCY HANDLERS ARE FOLLOWS
      stream.on('limit', function(limitMessage) {
        console.log("limitMessage");
      });

      stream.on('warning', function(warning) {
       console.log("warning");
      });

      stream.on('uncaughtException',function(exception){
        console.log("exception");
      });

      stream.on('error',function(error){
       console.log('error');
      });

      stream.on('end',function(end){
        console.log("END");
        end.emit("connected");
      });

      stream.on('disconnect', function(disconnectMessage) {
       console.log("disconnectMessage");
        }); 
         

          //Adding Listeners limit for Broadcasting
      stream.setMaxListeners(800);
        });
  });//END OF RESTART SOCKET
socket.emit("connected");// TO TRIGGER RESTART
});
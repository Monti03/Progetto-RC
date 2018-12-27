var requestPromise = require('request-promise')
var express = require('express')
var app =  express()

var PORTA = 8082

var fs = require('fs');

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));//should parse to JSON results from requests automatically

var obj = JSON.parse(fs.readFileSync('./here_credentials.json', 'utf8'));
var appId = obj.appId;
var appCode = obj.appCode; 

function getCoordinates(res){
    var body =JSON.parse(res).Response.View[0].Result[0].Location.DisplayPosition
    var latitude = body.Latitude
    var longitude = body.Longitude
    tmp = {lati: latitude, long:longitude}
    
    return tmp
}

app.get('/routing/public/partenza=:Start&arrivo=:Destination',function(req,response){
  
   var departureAddress =  req.params.Start.replace(" ","+") 
    var desiredDestination = req.params.Destination.replace(" ","+")

    var departureURL = "https://geocoder.api.here.com/6.2/geocode.json?app_id=455tjCCjwc8IGDYu0VTH&app_code=5x3bNvjnmP-P_oGSnnLAfw&searchtext="+departureAddress
     requestPromise(departureURL)
    .then(res => getCoordinates(res))
    .then(function(departure){
        var destinationURL = "https://places.cit.api.here.com/places/v1/autosuggest?at="+departure.lati+","+departure.long+"&q="+desiredDestination+"&app_id="+appId+"&app_code="+appCode
        requestPromise(destinationURL)
        .then(dest => JSON.parse(dest).results[0])
        .then(function(destination){
            var url = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+appId+"&app_code="+appCode+"&waypoint0=geo!"+departure.lati+","+departure.long+"&waypoint1=geo!"+destination.position[0]+","+destination.position[1]+"&mode=fastest;publicTransport&combineChange=true"    
            requestPromise(url)
            .then(function(res){
                var percorsoJSON = JSON.parse(res)
                response.send(percorsoJSON) 
                
            })
        })
    })
});


app.get('/routing/car/partenza=:Start&arrivo=:Destination',function(req,response){
    
    var departureAddress =  req.params.Start.replace(" ","+") 
     var desiredDestination = req.params.Destination.replace(" ","+")
     

     var departureURL = "https://geocoder.api.here.com/6.2/geocode.json?app_id=455tjCCjwc8IGDYu0VTH&app_code=5x3bNvjnmP-P_oGSnnLAfw&searchtext="+departureAddress
      requestPromise(departureURL)
     .then(res => getCoordinates(res))
     .then(function(departure){
         var destinationURL = "https://places.cit.api.here.com/places/v1/autosuggest?at="+departure.lati+","+departure.long+"&q="+desiredDestination+"&app_id="+appId+"&app_code="+appCode
         requestPromise(destinationURL)
         .then(dest => JSON.parse(dest).results[0])
         .then(function(destination){
             var url = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+appId+"&app_code="+appCode+"&waypoint0=geo!"+departure.lati+","+departure.long+"&waypoint1=geo!"+destination.position[0]+","+destination.position[1]+"&mode=fastest;car;traffic:disabled"    
             requestPromise(url)
             .then(function(res){
                 var percorsoJSON = JSON.parse(res)
                 response.send(percorsoJSON) 
                 
             })
         })
     })
 });




app.listen(PORTA)

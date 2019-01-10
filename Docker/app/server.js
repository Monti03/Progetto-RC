var requestPromise = require('request-promise')
var express = require('express')
var bodyParser = require("body-parser");
var fs = require('fs');
var oauth = require('oauth');
var Twitter = require('./twitter');

var PORTA = 8081
var users = []
var array_id = []

var app =  express()
var obj = JSON.parse(fs.readFileSync('./here_credentials.json', 'utf8'));
var appId = obj.appId;
var appCode = obj.appCode;  
app.use(bodyParser.urlencoded({ extended: false }));//should parse to JSON results from requests automatically
app.use(bodyParser.json());

var obj = JSON.parse(fs.readFileSync('./twitter_credentials.json', 'utf8'));
var _twitterConsumerKey = obj._twitterConsumerKey;
var _twitterConsumerSecret=obj._twitterConsumerSecret; 
var dep;
var des;

class Obj{
    constructor(oauthToken,textToPost){
        this.textToPost = textToPost
        this.oauthToken = oauthToken
    }
}

class Roba_record {
    constructor(id, ws) {
        this.id = id
        this.ws = ws
    }
}

function consumer(facilities) {
    return new oauth.OAuth(
        "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
        _twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://127.0.0.1:8080/sessions/callback?facilities=" + facilities, "HMAC-SHA1");
}


app.post('/sessions/connect', function(req, res){
	console.log("ho ricevuto una richiesta")
	var departure = req.body.departure.replace("+"," ")
	var destination = req.body.destination.replace("+"," ")
    consumer("car").getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
        if (error) {
            console.log(error)
            res.status(500).send("Error getting OAuth request token : " +error.toString());
        } else {
            console.log("\nIl Token oauth nella connect è "+oauthToken);
            var textToPost = "Parto da "+departure+" e arrivo a "+destination+" a qualcuno serve un passaggio?"
            users.push(new Obj(oauthToken,textToPost))
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+oauthToken);
        }
    });
});

app.get('/sessions/connect', function(req, res){
    console.log("ho ricevuto una richiesta")
    var id = req.query.id
    consumer("publicT").getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
        if (error) {
            console.log(error)
            res.status(500).send("Error getting OAuth request token : " +error.toString());
        } else {
            console.log("\nIl Token oauth nella connect è "+oauthToken + "\n");
            array_id.push(new Obj(oauthToken, id))
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+oauthToken);
        }
    });
});

app.get('/sessions/callback', function(req, res){
    
    var oauthRequestToken = req.query.oauth_token
    var facilities = req.query.facilities;
    
    console.log("\nIl token oauth nella callback è: "+oauthRequestToken);
    consumer(facilities).getOAuthAccessToken(oauthRequestToken,"", req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        if (error) {
            console.log(error)
            res.status(500).send("Error getting OAuth access token : " + (error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+(results)+"]");
        } else if(facilities == "car") {

            var textToPost = "";
            var i = 0
            for (i = 0; i<users.length; i++){
                if(users[i].oauthToken == oauthRequestToken){
                    textToPost = users[i].textToPost
                }
            }
            
            var client = new Twitter({
                consumer_key: _twitterConsumerKey,
                consumer_secret: _twitterConsumerSecret,
                access_token_key: oauthAccessToken,
                access_token_secret: oauthAccessTokenSecret
            });
              
            client.post({status: textToPost },  function(error, tweet, response) {
                if(error){ 
                    console.log(error+"\n\n");
                    errorFunction("errore nella post", res)
                }
                else{
                    console.log("\nPOSTED SUCCESSFULLY\n");
		            res.send(autoCloseHtml)
                }
            }); 

        } else if(facilities == "publicT") {
            consumer(facilities).get("https://api.twitter.com/1.1/account/verify_credentials.json", oauthAccessToken, oauthAccessTokenSecret, function (error, data, response) {
                if (error) {
                    console.log(error)
                    res.status(500).send("Error getting twitter screen name")
                } else {
                    console.log("data is %j\n", data)
                    data = JSON.parse(data)
                    var id
                    var i = 0
                    for (i = 0; i<array_id.length; i++){
                        if(array_id[i].oauthToken == oauthRequestToken){
                            id = array_id[i].textToPost
                            break;
                        }
                    }
                    var lunghezzaVar = roba.length
                    for(i = 0; i < lunghezzaVar; i++) {
                        if(roba[i].id == parseInt(id)) {
                            roba[i].id = data["screen_name"]
                            roba[i].ws.send("[set id]" + roba[i].id)
                            break;
                        }
                    }
                    res.send(autoCloseHtml)
                }
            });
        } else {
            console.log("Error in passing parameters\n");
        }
    });
});



function getCoordinates(res){
    var body =JSON.parse(res).Response.View[0].Result[0].Location.DisplayPosition
    var latitude = body.Latitude
    var longitude = body.Longitude
    tmp = {lati: latitude, long:longitude}
    //console.log(tmp)
    return tmp
}

function fabricFinalURL(partenza, destination,facilities){ //tmpTot contiene due risultati di promesse diversi -> il primo un json con latitudine e longitudine, il secondo con tutte le corrispondenze del dato cercato, per questo è trattato in maniera diversa
    //console.log("qua ->"+partenza.lati+" // "+ destination[0])
    //var url = "https://transit.api.here.com/v3/route.json?app_id="+appId+"&app_code=appCode&routing=all&dep="+partenza[0].lati+","+partenza[0].long+"&arr="+destination[0]+","+destination[1]+"&time=2018-11-19T07%3A30%3A00"
    
    var url;
    if (facilities == "car"){
        if (facilities == "fpublicT") {
            console.log("Error in selecting checkboxes");
            //do shutdown
        }
        url = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+appId+"&app_code="+appCode+"&waypoint0=geo!"+partenza.lati+","+partenza.long+"&waypoint1=geo!"+destination[0]+","+destination[1]+"&mode=fastest;car&representation=display&maneuverattributes=direction,action&routeattributes=waypoints,summary,shape,legs"

    }
    else if (facilities == "publicT"){
        url = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+appId+"&app_code="+appCode+"&waypoint0=geo!"+partenza.lati+","+partenza.long+"&waypoint1=geo!"+destination[0]+","+destination[1]+"&mode=fastest;publicTransport&combineChange=true"
    }
    else {
        console.log("Error in selecting checkboxes");
    }
    
    return url
}

function getNearestDestination(res, desiredDestination){
    //console.log(res)
    var destinationURL = "https://places.cit.api.here.com/places/v1/autosuggest?at="+res.lati+","+res.long+"&q="+desiredDestination+"&app_id="+appId+"&app_code="+appCode
    //console.log(destination)
    return destinationURL
}

function errorFunction(err, response, i){
    console.log("err: \n"+err+"\n\n")
    response.sendfile("./ErrorPage/error.html")
}

function routing(departureAddress,desiredDestination,facilities,response){
    var departureURL = "https://geocoder.api.here.com/6.2/geocode.json?app_id="+appId+"&app_code="+appCode+"&searchtext="+departureAddress
    //Promise.all([partenza])
    requestPromise(departureURL)
    .then(res => getCoordinates(res))
    .then(function(departure){
        
        var destinationURL = getNearestDestination(departure,desiredDestination)
        requestPromise(destinationURL)
        .then(destinations => JSON.parse(destinations).results[0])// might return more destinations, we'll take the nearest (the first)
        .then(function(destination){//destinations => console.log(destinations))//fabricFinalURL(destinations,part))
            //console.log("destination :"+destination)

            var finalURL = fabricFinalURL(departure, destination.position,facilities)
            requestPromise(finalURL)
            .then(function(res){

                var percorsoJSON = JSON.parse(res)
                /* console.log(percorsoJSON.response+"\n1")
                console.log(percorsoJSON.response+"\n12")
                console.log(percorsoJSON.response.route[0]+"\n13")
                console.log(percorsoJSON.response.route[0]+"\n14")
                console.log(percorsoJSON.response.route[0].leg[0].maneuver+"\n15") */
                console.log(percorsoJSON.response.route[0])
                var maneuver = percorsoJSON.response.route[0].leg[0].maneuver
                var str = '' 
                var tot = ''
                var i = 0
                try{
                    while(true){
                        str = maneuver[i]
                        i = i + 1
                        //console.log(i+":\n\t"+str.instruction) 
                        var transportIcon = ''
                        if(str.instruction.indexOf("Metro") > -1) {
                            transportIcon = '<i class="fas fa-subway"></i>'
                        } else if(str.instruction.indexOf("train") > -1 || str.instruction.indexOf("rail") > -1) {
                            transportIcon = '<i class="fas fa-train"></i>'
                        } else if(str.instruction.indexOf("bus") > -1) {
                            transportIcon = '<i class="fas fa-bus"></i>'
                        } else {
                            transportIcon = '<i class="fas fa-walking"></i>'
                        }
                        tot = tot + '<p>' + transportIcon +  '&#9' + str.instruction + '</p>' + '<hr>\n'
                    }
                }
                catch(e){}  
                if(facilities == "car"){
                    //response.send(firstHtmlCar+tot+secondHtmlCar+dep+thirdHtmlCar+des+fourthHtmlCar)
                    var str1 = JSON.stringify(percorsoJSON.response.route[0]).split("'")
                    tmp1 = ""
                    for(k1 in str1){
                        tmp1 = tmp1 + "\\'" +str1[k1]
                    }
                    console.log(tmp1)
                    var str = tmp1.substr(2).split("\\\"")//JSON.stringify(percorsoJSON.response.route[0]).split("\\\"")
                    tmp = ""
                    for (k in str){
                        tmp = tmp + "\\'" + str[k]
                    }
                    response.send(prova+"'"+tmp.substr(2)+"'"+prova2+secondHtmlCar+departureAddress+thirdHtmlCar+desiredDestination+fourthHtmlCar)
                }
                else{
                    response.send(firstHtml+tot+secondHtml)
                }
                return
            })
            .catch(err =>errorFunction(err, response,1))
        })
        .catch(err =>errorFunction(err, response,2))
    })
    .catch(err => errorFunction(err, response,3))

}

app.post('/node', function(request, response){
    //var reqJS = JSON.parse(request)
    var facilities = request.body.facilities;
    //dep = request.body.from
    //des = request.body.to
    var departureAddress =  request.body.from.replace(" ","+") //il client dovrà fare una post con due campi -> indirizzo e cerco
    var desiredDestination = request.body.to.replace(" ","+")

    routing(departureAddress,desiredDestination,facilities,response);

    /* var departureAddress = "via+battistini"
    var desiredDestination = "MC" */

    //var destination = "https://places.cit.api.here.com/places/v1/autosuggest?at=41.9590222,12.4116381&q="+desiredDestination+"&app_id="+appId+"&app_code="+appCode

    /* var destination =requestPromise(destination) //questo deve dipendere dalla partenza in destination ?at=41.9590222,12.4116381
    .then(res => JSON.parse(res))
    .catch(err => console.log(err+"\n\ndestination")) */

    //var partenza = requestPromise(departureURL)
    //.then(res => getLongLat(res))//1
    //.catch(err =>errorFunction(err, response)) 

//http://localhost:8081/node
    
    /*
    1 -> calcolo lat e lon di partenza
    2 -> trovo posto vicino alla partenza
    3 -> calcolo strada 
    */
});

app.listen(PORTA)
var roba = [] //ci sono tutti i ws attivi, quelli chiusi li tolgo al prossimo msg
var last_id = 0;

var WebSocketServer = require('ws').Server,
  	wss = new WebSocketServer({port: 40510})
	wss.on('connection', function (ws) { //quando qualcuno si connette viene eseguita questa funzione e ws è il websocket relativo alla connessione
        console.log('connessione')
        roba.push(new Roba_record(last_id, ws))                 //roba è un vettore su cio tramite push inserisco ws
        last_id = last_id + 1
  		ws.on('message', function (message) {//quando arriva un messaggio parte questa callback
			console.log('received: %s', message)
			if(message != ""){
                if(message != "request id") {
                    //ws.send(`${new Date()}`)
                    var i = 0
                    var lunghezzaVar = roba.length //a quanti websocket devo mandare il messaggio (la chat è broadcast)
                    while(i<lunghezzaVar){
                        console.log(i +" "+ lunghezzaVar)
                        try{
                            roba[i].ws.send(message)   //mando il messaggio ricevuto ad ognuno
                            i = i + 1
                        }
                        catch(e){ // se ws chiuso -> rimuovo dal vettore di ws -> devo ridurre la lunghezza e non updatare i
                            roba.splice(i, 1);  //rimuove il ws potenzialmente chiuso o crashato
                            lunghezzaVar = lunghezzaVar -1
                        }
                    }
                } else {
                    var i;
                    var lunghezzaVar = roba.length
                    for(i = 0; i < lunghezzaVar; i++) {
                        if(roba[i].ws == ws) {
                            ws.send("[set id]" + roba[i].id)
                            break;
                        }
                    }
                }
			}
  		})
})
console.log("listening on %s",PORTA)


var secondHtmlCar = "<div style=\"position:absolute; width:49%; left:51%; height:10%; bottom: 0; background:inherit\"\>\n<form action=\"http://localhost:8080/sessions/connect\" method =\"post\" target = \"_blank\" onSubmit=\"getElementById('SUBMIT').setAttribute('disabled', 'disabled')\">\n"
+"<input type=\"hidden\" name=\"departure\"  value=\"";

var thirdHtmlCar = "\">"
+"<input type=\"hidden\" name=\"destination\"  value=\"";


var fourthHtmlCar = "\">\n"
+"<input type=\"submit\" id =\"SUBMIT\" value=\"post su twitter\">\n"
+"</form>\n</div>\n"
+"</body>\n</html>"


var autoCloseHtml = "<!doctype html><html><head><script>\n"
+"window.onload = function load() {+\n"
+"window.open('', '_self', '');\n"
  +"window.close();\n"
+"};\n"
+"</script></head><body></body></html>"

var firstHtml = "<html>\n"+
"<head>\n"+
"<link rel=\"stylesheet\" href=\"https://use.fontawesome.com/releases/v5.6.3/css/all.css\" integrity=\"sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/\" crossorigin=\"anonymous\">\n"+
"</head>\n"+
"<script>\n"+
"   var id;\n"+
"	var ws = new WebSocket('ws://localhost:8080/ws/');\n"+
"	ws.onopen = function () {\n"+
"		console.log('websocket is connected ...');\n"+
"       ws.send(\"request id\");\n"+
"	}\n"+
"	ws.onmessage = function (ev) {\n"+
"	    console.log(ev);\n"+
"       if(ev.data.startsWith(\"[set id]\")) {\n"+
"           id = ev.data.substring(8);\n"+
"           if(!isNaN(id)) document.getElementById('Link').setAttribute(\"href\", 'http://localhost:8080/sessions/connect?id=' + id);\n"+
"       }\n"+
"       else addToList(ev.data, id);\n"+	
"	}\n"+
"   setInterval(function(){\n"+
"      ws.send('')\n"+    
"   }, 60000);\n"+
"	function mySend(){\n"+
"       var value = document.getElementById('from').value;\n"+
"       if(value != \"\") {\n"+
"		    var nameValue;\n"+
"           if(isNaN(id)) nameValue = \"[\" + id + \"]\";\n"+
"           else nameValue = \"[Unknown\" + id + \"]\";\n"+
"           nameValue += value;\n"+
"		    try{\n"+
"               document.getElementById('from').value = '';\n"+
"			    ws.send(nameValue);\n"+
"		    }catch(e){\n ws = new WebSocket('ws://localhost:8080/ws/');\n"+
"			    ws.send(nameValue);}	\n"+
"	    }\n"+
"   }\n"+
"</script>\n"+
"<body>\n"

var secondHtml = "<br>\n"
    +"<a id=\"Link\" target=\"_blank\">accedi su twitter</a>\n"
    +"<div style=\"overflow-y: scroll; height:200px;\">"
	+"<ul id=\"myList\"></ul>"
	+"<script>"
		+"function addToList(msg, id) {\n"
            +"var node = document.createElement('LI');\n"
            +"var to_disc = 0;\n"
            +"if(msg.startsWith(\"[\" + id + \"]\")) to_disc = id.length + 2;\n"
            +"else if(msg.startsWith(\"[Unknown\" + id + \"]\")) to_disc = id.length + 9;\n"
            +"if(to_disc > 0) msg = \"[You]\" + msg.slice(to_disc);\n"
			+"var textnode = document.createTextNode(msg);\n"
			+"node.appendChild(textnode);\n"
			+"document.getElementById('myList').appendChild(node);\n"
		+"}\n"
	+"</script>"
+"</div>"
+"<form class=\"chat\" action=\"JavaScript:mySend();\">"
+"	<input type=\"text\" name=\"from\" id=\"from\" value=\"clickToSend\">"
+"	<input type=\"submit\" value=\"Submit\">"
+"</form>"
+"</body>"
+"</html>"

var prova = "<!DOCTYPE html>\n"+
"<html>\n"+
"<head>\n"+
"<meta name=\"viewport\" content=\"initial-scale=1.0, width=device-width\" />\n"+
"<link rel=\"stylesheet\" type=\"text/css\" href=\"https://js.api.here.com/v3/3.0/mapsjs-ui.css?dp-version=1542186754\" />\n"+
"<script type=\"text/javascript\" src=\"https://js.api.here.com/v3/3.0/mapsjs-core.js\"></script>\n"+
"<script type=\"text/javascript\" src=\"https://js.api.here.com/v3/3.0/mapsjs-service.js\"></script>\n"+
"<script type=\"text/javascript\" src=\"https://js.api.here.com/v3/3.0/mapsjs-ui.js\"></script>\n"+
"<script type=\"text/javascript\" src=\"https://js.api.here.com/v3/3.0/mapsjs-mapevents.js\"></script>\n"+
"<style type=\"text/css\">\n"+
".directions li span.arrow {\n"+
"  display:inline-block;\n"+
"  min-width:28px;\n"+
"  min-height:28px;\n"+
"  background-position:0px;\n"+
"  position:relative;\n"+
"  top:8px;\n"+
"}\n"+
".directions li span.depart  {\n"+
"  background-position:-28px;\n"+
"}\n"+
".directions li span.rightUTurn  {\n"+
"  background-position:-56px;\n"+
"}\n"+
".directions li span.leftUTurn  {\n"+
"  background-position:-84px;\n"+
"}\n"+
".directions li span.rightFork  {\n"+
"  background-position:-112px;\n"+
"}\n"+
".directions li span.leftFork  {\n"+
"  background-position:-140px;\n"+
"}\n"+
".directions li span.rightMerge  {\n"+
"  background-position:-112px;\n"+
"}\n"+
".directions li span.leftMerge  {\n"+
"  background-position:-140px;\n"+
"}\n"+
".directions li span.slightRightTurn  {\n"+
"  background-position:-168px;\n"+
"}\n"+
".directions li span.slightLeftTurn{\n"+
"  background-position:-196px;\n"+
"}\n"+
".directions li span.rightTurn  {\n"+
"  background-position:-224px;\n"+
"}\n"+
".directions li span.leftTurn{\n"+
"  background-position:-252px;\n"+
"}\n"+
".directions li span.sharpRightTurn  {\n"+
"  background-position:-280px;\n"+
"}\n"+
".directions li span.sharpLeftTurn{\n"+
"  background-position:-308px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit1 {\n"+
"  background-position:-616px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit2 {\n"+
"  background-position:-644px;\n"+
"}\n"+
"\n"+
".directions li span.rightRoundaboutExit3 {\n"+
"  background-position:-672px;\n"+
"}\n"+
"\n"+
".directions li span.rightRoundaboutExit4 {\n"+
"  background-position:-700px;\n"+
"}\n"+
"\n"+
".directions li span.rightRoundaboutPass {\n"+
"  background-position:-700px;\n"+
"}\n"+
"\n"+
".directions li span.rightRoundaboutExit5 {\n"+
"  background-position:-728px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit6 {\n"+
"  background-position:-756px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit7 {\n"+
"  background-position:-784px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit8 {\n"+
"  background-position:-812px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit9 {\n"+
"  background-position:-840px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit10 {\n"+
"  background-position:-868px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit11 {\n"+
"  background-position:896px;\n"+
"}\n"+
".directions li span.rightRoundaboutExit12 {\n"+
"  background-position:924px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit1  {\n"+
"  background-position:-952px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit2  {\n"+
"  background-position:-980px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit3  {\n"+
"  background-position:-1008px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit4  {\n"+
"  background-position:-1036px;\n"+
"}\n"+
".directions li span.leftRoundaboutPass {\n"+
"  background-position:1036px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit5  {\n"+
"  background-position:-1064px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit6  {\n"+
"  background-position:-1092px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit7  {\n"+
"  background-position:-1120px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit8  {\n"+
"  background-position:-1148px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit9  {\n"+
"  background-position:-1176px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit10  {\n"+
"  background-position:-1204px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit11  {\n"+
"  background-position:-1232px;\n"+
"}\n"+
".directions li span.leftRoundaboutExit12  {\n"+
"  background-position:-1260px;\n"+
"}\n"+
".directions li span.arrive  {\n"+
"  background-position:-1288px;\n"+
"}\n"+
".directions li span.leftRamp  {\n"+
"  background-position:-392px;\n"+
"}\n"+
".directions li span.rightRamp  {\n"+
"  background-position:-420px;\n"+
"}\n"+
".directions li span.leftExit  {\n"+
"  background-position:-448px;\n"+
"}\n"+
".directions li span.rightExit  {\n"+
"  background-position:-476px;\n"+
"}\n"+
"\n"+
".directions li span.ferry  {\n"+
"  background-position:-1316px;\n"+
"}\n"+
"</style>\n"+
"</head>\n"+
"<body>\n"+
"\n"+
"  <div id=\"map\" style=\"position:absolute; width:49%; height:100%; background:grey\" ></div>\n"+
"  <div id=\"panel\" style=\"position:absolute; width:49%; left:51%; height:90%; background:inherit\" ></div>\n"+
"\n"+
"  <script  type=\"text/javascript\" charset=\"UTF-8\" >\n"+
"    \n"+
"\n"+
"function onSuccess() {\n"+
"  var route1 = "//result.response.route[0];\n"+

var prova2 =";\n   try{route = JSON.parse(route1);\n"+
"  addRouteShapeToMap(route);\n"+
"  addManueversToMap(route);\n"+
"\n"+
"  addWaypointsToPanel(route.waypoint);\n"+
"  addManueversToPanel(route);\n"+
"  //addSummaryToPanel(route.summary);\n"+
"}catch(e){onError(e)}"+
"}\n"+
"\n"+
"/**\n"+
" * This function will be called if a communication error occurs during the JSON-P request\n"+
" * @param  {Object} error  The error message received.\n"+
" */\n"+
"function onError(error) {\n"+
"  alert('Ooops!');\n"+
"}\n"+
"\n"+
"\n"+
"\n"+
"\n"+
"/**\n"+
" * Boilerplate map initialization code starts below:\n"+
" */\n"+
"\n"+
"// set up containers for the map  + panel\n"+
"var mapContainer = document.getElementById('map'),\n"+
"  routeInstructionsContainer = document.getElementById('panel');\n"+
"\n"+
"//Step 1: initialize communication with the platform\n"+
"var platform = new H.service.Platform({\n"+
"  app_id: 'devportal-demo-20180625',\n"+
"  app_code: '9v2BkviRwi9Ot26kp2IysQ',\n"+
"  useHTTPS: true\n"+
"});\n"+
"var pixelRatio = window.devicePixelRatio || 1;\n"+
"var defaultLayers = platform.createDefaultLayers({\n"+
"  tileSize: pixelRatio === 1 ? 256 : 512,\n"+
"  ppi: pixelRatio === 1 ? undefined : 320\n"+
"});\n"+
"\n"+
"//Step 2: initialize a map - this map is centered over Berlin\n"+
"var map = new H.Map(mapContainer,\n"+
"  defaultLayers.normal.map,{\n"+
"  center: {lat:52.5160, lng:13.3779},\n"+
"  zoom: 13,\n"+
"  pixelRatio: pixelRatio\n"+
"});\n"+
"\n"+
"//Step 3: make the map interactive\n"+
"// MapEvents enables the event system\n"+
"// Behavior implements default interactions for pan/zoom (also on mobile touch environments)\n"+
"var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));\n"+
"\n"+
"// Create the default UI components\n"+
"var ui = H.ui.UI.createDefault(map, defaultLayers);\n"+
"\n"+
"// Hold a reference to any infobubble opened\n"+
"var bubble;\n"+
"\n"+
"/**\n"+
" * Opens/Closes a infobubble\n"+
" * @param  {H.geo.Point} position     The location on the map.\n"+
" * @param  {String} text              The contents of the infobubble.\n"+
" */\n"+
"function openBubble(position, text){\n"+
" if(!bubble){\n"+
"    bubble =  new H.ui.InfoBubble(\n"+
"      position,\n"+
"      // The FO property holds the province name.\n"+
"      {content: text});\n"+
"    ui.addBubble(bubble);\n"+
"  } else {\n"+
"    bubble.setPosition(position);\n"+
"    bubble.setContent(text);\n"+
"    bubble.open();\n"+
"  }\n"+
"}\n"+
"\n"+
"\n"+
"/**\n"+
" * Creates a H.map.Polyline from the shape of the route and adds it to the map.\n"+
" * @param {Object} route A route as received from the H.service.RoutingService\n"+
" */\n"+
"function addRouteShapeToMap(route){\n"+
"  var lineString = new H.geo.LineString(),\n"+
"    routeShape = route.shape,\n"+
"    polyline;\n"+
"\n"+
"  routeShape.forEach(function(point) {\n"+
"    var parts = point.split(',');\n"+
"    lineString.pushLatLngAlt(parts[0], parts[1]);\n"+
"  });\n"+
"\n"+
"  polyline = new H.map.Polyline(lineString, {\n"+
"    style: {\n"+
"      lineWidth: 4,\n"+
"      strokeColor: 'rgba(0, 128, 255, 0.7)'\n"+
"    }\n"+
"  });\n"+
"  // Add the polyline to the map\n"+
"  map.addObject(polyline);\n"+
"  // And zoom to its bounding rectangle\n"+
"  map.setViewBounds(polyline.getBounds(), true);\n"+
"}\n"+
"\n"+
"\n"+
"/**\n"+
" * Creates a series of H.map.Marker points from the route and adds them to the map.\n"+
" * @param {Object} route  A route as received from the H.service.RoutingService\n"+
" */\n"+
"function addManueversToMap(route){\n"+
"  var svgMarkup = '<svg width=\"18\" height=\"18\"' +\n"+
"    'xmlns=\"http://www.w3.org/2000/svg\">' +\n"+
"    '<circle cx=\"8\" cy=\"8\" r=\"8\" ' +\n"+
"      'fill=\"#1b468d\" stroke=\"white\" stroke-width=\"1\"  />' +\n"+
"    '</svg>',\n"+
"    dotIcon = new H.map.Icon(svgMarkup, {anchor: {x:8, y:8}}),\n"+
"    group = new  H.map.Group(),\n"+
"    i,\n"+
"    j;\n"+
"\n"+
"  // Add a marker for each maneuver\n"+
"  for (i = 0;  i < route.leg.length; i += 1) {\n"+
"    for (j = 0;  j < route.leg[i].maneuver.length; j += 1) {\n"+
"      // Get the next maneuver.\n"+
"      maneuver = route.leg[i].maneuver[j];\n"+
"      // Add a marker to the maneuvers group\n"+
"      var marker =  new H.map.Marker({\n"+
"        lat: maneuver.position.latitude,\n"+
"        lng: maneuver.position.longitude} ,\n"+
"        {icon: dotIcon});\n"+
"      marker.instruction = maneuver.instruction;\n"+
"      group.addObject(marker);\n"+
"    }\n"+
"  }\n"+
"\n"+
"  group.addEventListener('tap', function (evt) {\n"+
"    map.setCenter(evt.target.getPosition());\n"+
"    openBubble(\n"+
"       evt.target.getPosition(), evt.target.instruction);\n"+
"  }, false);\n"+
"\n"+
"  // Add the maneuvers group to the map\n"+
"  map.addObject(group);\n"+
"}\n"+
"\n"+
"\n"+
"/**\n"+
" * Creates a series of H.map.Marker points from the route and adds them to the map.\n"+
" * @param {Object} route  A route as received from the H.service.RoutingService\n"+
" */\n"+
"function addWaypointsToPanel(waypoints){\n"+
"\n"+
"\n"+
"\n"+
"  var nodeH3 = document.createElement('h3'),\n"+
"    waypointLabels = [],\n"+
"    i;\n"+
"\n"+
"\n"+
"   for (i = 0;  i < waypoints.length; i += 1) {\n"+
"    waypointLabels.push(waypoints[i].label)\n"+
"   }\n"+
"\n"+
"   nodeH3.textContent = waypointLabels.join(' - ');\n"+
"\n"+
"  routeInstructionsContainer.innerHTML = '';\n"+
"  routeInstructionsContainer.appendChild(nodeH3);\n"+
"}\n"+
"\n"+
"/**\n"+
" * Creates a series of H.map.Marker points from the route and adds them to the map.\n"+
" * @param {Object} route  A route as received from the H.service.RoutingService\n"+
" */\n"+
"function addSummaryToPanel(summary){\n"+
"  var summaryDiv = document.createElement('div'),\n"+
"   content = '';\n"+
"   content += '<b>Total distance</b>: ' + summary.distance  + 'm. <br/>';\n"+
"   content += '<b>Travel Time</b>: ' + summary.travelTime.toMMSS() + ' (in current traffic)';\n"+
"\n"+
"\n"+
"  summaryDiv.style.fontSize = 'small';\n"+
"  summaryDiv.style.marginLeft ='5%';\n"+
"  summaryDiv.style.marginRight ='5%';\n"+
"  summaryDiv.innerHTML = content;\n"+
"  routeInstructionsContainer.appendChild(summaryDiv);\n"+
"}\n"+
"\n"+
"/**\n"+
" * Creates a series of H.map.Marker points from the route and adds them to the map.\n"+
" * @param {Object} route  A route as received from the H.service.RoutingService\n"+
" */\n"+
"function addManueversToPanel(route){\n"+
"\n"+
"\n"+
"\n"+
"  var nodeOL = document.createElement('ol'),\n"+
"    i,\n"+
"    j;\n"+
"\n"+
"  nodeOL.style.fontSize = 'small';\n"+
"  nodeOL.style.marginLeft ='5%';\n"+
"  nodeOL.style.marginRight ='5%';\n"+
"  nodeOL.className = 'directions';\n"+
"\n"+
"     // Add a marker for each maneuver\n"+
"  for (i = 0;  i < route.leg.length; i += 1) {\n"+
"    for (j = 0;  j < route.leg[i].maneuver.length; j += 1) {\n"+
"      // Get the next maneuver.\n"+
"      maneuver = route.leg[i].maneuver[j];\n"+
"\n"+
"      var li = document.createElement('li'),\n"+
"        spanArrow = document.createElement('span'),\n"+
"        spanInstruction = document.createElement('span');\n"+
"\n"+
"      spanArrow.className = 'arrow '  + maneuver.action;\n"+
"      spanInstruction.innerHTML = maneuver.instruction;\n"+
"      li.appendChild(spanArrow);\n"+
"      li.appendChild(spanInstruction);\n"+
"\n"+
"      nodeOL.appendChild(li);\n"+
"    }\n"+
"  }\n"+
"\n"+
"  routeInstructionsContainer.appendChild(nodeOL);\n"+
"}\n"+
"\n"+
"\n"+
"Number.prototype.toMMSS = function () {\n"+
"  return  Math.floor(this / 60)  +' minutes '+ (this % 60)  + ' seconds.';\n"+
"}\n"+
"\n"+
"// Now use the map as required...\n"+
"onSuccess();\n"+
"  </script>\n"

var requestPromise = require('request-promise')
var express = require('express')
var bodyParser = require("body-parser");
var fs = require('fs');
var oauth = require('oauth');
var Twitter = require('./twitter');

var PORTA = 8081
var users = []

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
    consumer("publicT").getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
        if (error) {
            console.log(error)
            res.status(500).send("Error getting OAuth request token : " +error.toString());
        } else {
            console.log("\nIl Token oauth nella connect è "+oauthToken + "\n");
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+oauthToken);
        }
    });
});

app.get('/sessions/callback', function(req, res){
    
    var oauthRequestToken = req.query.oauth_token
    var facilities = req.query.facilities;
    
    console.log("\nIl token oauth nella callback è: "+oauthRequestToken);
    consumer(facilities).getOAuthAccessToken(oauthRequestToken, "", req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
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
              
            client.post({status: textToPost+" "+new Date().getTime()},  function(error, tweet, response) {
                if(error){ 
                    console.log(error+"\n\n");
                    errorFunction("errore nella post", res)
                }
                else{
                    console.log("\nPOSTED SUCCESSFULLY\n");
		            res.send(autoCloseHtml)
                }
            }); 

        }
        else if(facilities == "publicT") {
            consumer(facilities).get("https://api.twitter.com/1.1/account/verify_credentials.json", oauthAccessToken, oauthAccessTokenSecret, function (error, data, response) {
                if (error) {
                    console.log(error)
                    res.status(500).send("Error getting twitter screen name")
                }
                else {
                    console.log("data is %j\n", data)
                    data = JSON.parse(data)
                    res.send(autoCloseHtml)
                    //Manca la parte in cui bisogna associare lo screen_name alla ws
                }
            });
        }
        else {
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
        url = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+appId+"&app_code="+appCode+"&waypoint0=geo!"+partenza.lati+","+partenza.long+"&waypoint1=geo!"+destination[0]+","+destination[1]+"&mode=fastest;car;traffic:disabled"

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
                        tot = tot + "<br>"+ str.instruction
                    }
                }
                catch(e){}  
                if(facilities == "car"){
                    response.send(firstHtmlCar+tot+secondHtmlCar+dep+thirdHtmlCar+des+fourthHtmlCar)
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
    dep = request.body.from
    des = request.body.to
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

var WebSocketServer = require('ws').Server,
  	wss = new WebSocketServer({port: 40510})
	wss.on('connection', function (ws) { //quando qualcuno si connette viene eseguita questa funzione e ws è il websocket relativo alla connessione
        console.log('connessione')
		roba.push(ws)                       //roba è un vettore su cio tramite push inserisco ws 
  		ws.on('message', function (message) {//quando arriva un messaggio parte questa callback
			console.log('received: %s', message)
			if(message != ""){
				//ws.send(`${new Date()}`)
				var i = 0
				var lunghezzaVar = roba.length //a quanti websocket devo mandare il messaggio (la chat è broadcast)
				while(i<lunghezzaVar){
					console.log(i +" "+ lunghezzaVar)
					try{
						roba[i].send(message)   //mando il messaggio ricevuto ad ognuno
						i = i + 1
					}
					catch(e){ // se ws chiuso -> rimuovo dal vettore di ws -> devo ridurre la lunghezza e non updatare i
						roba.splice(i, 1);  //rimuove il ws potenzialmente chiuso o crashato
						lunghezzaVar = lunghezzaVar -1
					}
				}
			}
  		})
})
console.log("listening on %s",PORTA)

var firstHtmlCar = "<html>\n"+"<body>\n";

var secondHtmlCar = "<form action=\"http://localhost:8080/sessions/connect\" method =\"post\" target = \"_blank\">"
+"	<input type=\"hidden\" name=\"departure\"  value=\"";

var thirdHtmlCar = "\">"
+"      <input type=\"hidden\" name=\"destination\"  value=\"";


var fourthHtmlCar = "\">"
+"	<input type=\"submit\" id =\"SUBMIT\" value=\"post su twitter\">"
+"</form>"
+"</body>"
+"</html>";

var autoCloseHtml = "<!doctype html><html><head><script>\n"
+"window.onload = function load() {+\n"
+"window.open('', '_self', '');\n"
  +"window.close();\n"
+"};\n"
+"</script></head><body></body></html>"

var firstHtml = "<html>\n"+
"<script>\n"+
"	var ws = new WebSocket('ws://localhost:8080/ws/');\n"+
"	ws.onopen = function () {\n"+
"		console.log('websocket is connected ...');\n"+
"	}\n"+
"	ws.onmessage = function (ev) {\n"+
"	console.log(ev);\n"+
"	addToList(ev.data);\n"+
"	}\n"+
"	function mySend(){\n"+
"		var nameValue = document.getElementById('from').value;\n"+
"		try{\n"+
"			document.getElementById('from').value = '';\n"+
"			ws.send(nameValue);\n"+
"		}catch(e){\n ws = new WebSocket('ws://localhost:8080/ws/');\n"+
"			ws.send(nameValue);}	\n"+
"	}\n"+
"</script>\n"+
"<body>\n"

var secondHtml = "<br>\n"
    +"<a href='http://localhost:8080/sessions/connect' target=\"_blank\">accedi su twitter</a>\n"
    +"<div style=\"overflow-y: scroll; height:200px;\">"
	+"<ul id=\"myList\"></ul>"
	+"<script>"
		+"function addToList(msg) {\n"
			+"var node = document.createElement('LI');\n"
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
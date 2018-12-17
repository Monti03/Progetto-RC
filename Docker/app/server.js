
var requestPromise = require('request-promise')
var express = require('express')
var app =  express()

var PORTA = 8081

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./here_credentials.json', 'utf8'));
var appId = obj.appId;
var appCode = obj.appCode; 

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));//should parse to JSON results from requests automatically


function getLongLat(res){
    var body =JSON.parse(res).Response.View[0].Result[0].Location.DisplayPosition
    var latitude = body.Latitude
    var longitude = body.Longitude
    tmp = {lati: latitude, long:longitude}
    //console.log(tmp)
    return tmp
}

function urlAssumeValore(partenza, arrivo){ //tmpTot contiene due risultati di promesse diversi -> il primo un json con latitudine e longitudine, il secondo con tutte le corrispondenze del dato cercato, per questo è trattato in maniera diversa
    console.log("qua ->"+partenza[0].lati+" // "+ arrivo[0])
    //var url = "https://transit.api.here.com/v3/route.json?app_id=455tjCCjwc8IGDYu0VTH&app_code=5x3bNvjnmP-P_oGSnnLAfw&routing=all&dep="+partenza[0].lati+","+partenza[0].long+"&arr="+arrivo[0]+","+arrivo[1]+"&time=2018-11-19T07%3A30%3A00"
    var url = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+appId+"&app_code="+appCode+"&waypoint0=geo!"+partenza[0].lati+","+partenza[0].long+"&waypoint1=geo!"+arrivo[0]+","+arrivo[1]+"&mode=fastest;publicTransport&combineChange=true"
    console.log(url)
    return url
}

function cosaCercoVicinoPartenza(res, cosaCerchi){
    console.log(res)
    var urlPostoCercato = "https://places.cit.api.here.com/places/v1/autosuggest?at="+res[0].lati+","+res[0].long+"&q="+cosaCerchi+"&app_id="+appId+"&app_code="+appCode
    console.log(urlPostoCercato)
    return urlPostoCercato
}

app.post('/posto', function(req,res){
    console.log(req.body.from)
    res.send("ok")
})

app.post('/node', function(request, response){
    //var reqJS = JSON.parse(request)
    var indPartenza =  request.body.from.replace(" ","+") //il client dovrà fare una post con due campi -> indirizzo e cerco
    var cosaCerchi = request.body.to.replace(" ","+")

    /* var indPartenza = "via+battistini"
    var cosaCerchi = "MC" */

    var urlPart = "https://geocoder.api.here.com/6.2/geocode.json?app_id=455tjCCjwc8IGDYu0VTH&app_code=5x3bNvjnmP-P_oGSnnLAfw&searchtext="+indPartenza
    var urlPostoCercato = "https://places.cit.api.here.com/places/v1/autosuggest?at=41.9590222,12.4116381&q="+cosaCerchi+"&app_id="+appId+"&app_code="+appCode

    /* var arrivo =requestPromise(urlPostoCercato) //questo deve dipendere dalla partenza in urlPostoCercato ?at=41.9590222,12.4116381
    .then(res => JSON.parse(res))
    .catch(err => console.log(err+"\n\narrivo")) */

    var partenza = requestPromise(urlPart)
    .then(res => getLongLat(res))//1
    .catch(err => console.log(err+"\n\nerr"))


    Promise.all([partenza])
    .then(function(part){
        var urlArrivo = cosaCercoVicinoPartenza(part,cosaCerchi)
        var destinazione = requestPromise(urlArrivo)
        .then(resArrivo => JSON.parse(resArrivo).results[0])// potrebbe restituire più destinazioni quindi prendiamo la prima (la piu vicina) 
        .then(function(arrivo){//resArrivo => console.log(resArrivo))//urlAssumeValore(resArrivo,part))
            console.log("arrivo :"+arrivo)
            console.log("part: "+part)

            var url = urlAssumeValore(part, arrivo.position)
            requestPromise(url)
            .then(function(res){

                console.log(res)
                var percorsoJSON = JSON.parse(res)
                /* console.log(percorsoJSON.response+"\n1")
                console.log(percorsoJSON.response+"\n12")
                console.log(percorsoJSON.response.route[0]+"\n13")
                console.log(percorsoJSON.response.route[0]+"\n14")
                console.log(percorsoJSON.response.route[0].leg[0].maneuver+"\n15") */

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
                response.send(htmlFist+tot+htmlSecond)
            })
            .catch(err => console.log(err+"\nerr"))
            

        })
        .catch(err => console.log(err +"\nerrrore"))
    })
    /*
    1 -> calcolo lat e lon di partenza
    2 -> trovo posto vicino alla partenza
    3 -> calcolo strada 
    */

});

app.listen(PORTA)
var roba = [] //ci sono tutti i ws attivi, quelli chiusi li tolgo al prossimo msg

app.get("/webapp/", function(req,res){
    res.send("ciao");
})

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
console.log("listening on 8081")

var htmlFist = "<html>"
+"<script>"
	+"var ws = new WebSocket('ws://localhost:8080/ws/');"
	+"ws.onopen = function () {\n"
		+"console.log('websocket is connected ...');\n"
	+"}\n" 
	+"ws.onmessage = function (ev) {\n"
	+	"console.log(ev);\n"
		+"addToList(ev.data);\n"
	+"}\n"
	+"function mySend(){\n"
		+"var nameValue = document.getElementById('from').value;\n"
		+"try{"
			+"document.getElementById('from').value = '';\n"
			+"ws.send(nameValue);\n"
		+"}catch(e){\n ws = new WebSocket('ws://localhost:8080/ws/');\n"
			+"ws.send(nameValue);}\n"	
	+"}\n"
+"</script>"
+"<body>"

var htmlSecond = "<div style=\"overflow-y: scroll; height:200px;\">"
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
+"	<input type=\"text\" name=\"from\" id=\"from\" value=\"GIGI\">"
+"	<input type=\"submit\" value=\"Submit\">"
+"</form>"
+"</body>"
+"</html>"

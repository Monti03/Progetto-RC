
var express = require('express')
var app =  express()

var roba = [] //ci sono tutti i ws attivi, quelli chiusi li tolgo al prossimo msg

app.get("/webapp/", function(req,res){
    res.send("ciao");
})

var WebSocketServer = require('ws').Server,
  	wss = new WebSocketServer({port: 40510})
	wss.on('connection', function (ws) {
        console.log('connessione')
		roba.push(ws)
  		ws.on('message', function (message) {
			console.log('received: %s', message)
			if(message != ""){
				//ws.send(`${new Date()}`)
				var i = 0
				var lunghezzaVar = roba.length
				while(i<lunghezzaVar){
					console.log(i +" "+ lunghezzaVar)
					try{
						roba[i].send(message)
						i = i + 1
					}
					catch(e){ // se ws chiuso -> rimuovo dal vettore di ws -> devo ridurre la lunghezza e non updatare i
						roba.splice(i, 1);
						lunghezzaVar = lunghezzaVar -1
					}
				}
			}
  		})
})
console.log("listening on 8081")
app.listen(8081)
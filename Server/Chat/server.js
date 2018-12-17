
var express = require('express')
var app =  express()

var roba = [] //ci sono tutti i ws attivi, quelli chiusi li tolgo al prossimo msg

app.get("/webapp/", function(req,res){
    res.send("ciao");
})

var WebSocketServer = require('ws').Server,
  	wss = new WebSocketServer({port: 40510})
	wss.on('connection', function (ws) {	//quando qualcuno si connette viene eseguita questa funzione e ws è il websocket relativo alla connessione
        console.log('connessione')
		roba.push(ws)						//roba è un vettore su cio tramite push inserisco ws in testa (?)
  		ws.on('message', function (message) {	//quando arriva un messaggio parte questa callback
			console.log('received: %s', message)
			if(message != ""){
				//ws.send(`${new Date()}`)
				var i = 0
				var lunghezzaVar = roba.length  //a quanti websocket devo mandare il messaggio (la chat è broadcast)
				while(i<lunghezzaVar){
					console.log(i +" "+ lunghezzaVar)
					try{
						roba[i].send(message)	//mando il messaggio ricevuto ad ognuno
						i = i + 1
					}
					catch(e){ // se ws chiuso -> rimuovo dal vettore di ws -> devo ridurre la lunghezza e non updatare i
						roba.splice(i, 1);			//rimuove il ws potenzialmente chiuso o crashato
						lunghezzaVar = lunghezzaVar -1
					}
				}
			}
  		})
})
console.log("listening on 8081")
app.listen(8081)
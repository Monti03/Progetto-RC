#!/bin/bash
echo "scrivi la tua partenza:"
read partenza
echo "scrivi la tua destinazione:"
read destinazione
echo "macchina[car] o mezzi[public]:"
read transport

function tran {
	if (($transport == "car"))
	then
		curl http://localhost:8082/routing/car/partenza=:$partenza"&"arrivo=:$destinazione
		
	else	
		curl http://localhost:8082/routing/public/partenza=:$partenza"&"arrivo=:$destinazione
	fi
}

tran

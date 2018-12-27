var requestPromise = require('request-promise')
var express = require('express')
var app =  express()

var PORTA = 3000

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./here_credentials.json', 'utf8'));
var appId = obj.appId;
var appCode = obj.appCode; 



var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));  //should parse to JSON results from requests automatically


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
    //var url = "https://transit.api.here.com/v3/route.json?app_id="+appId+"&app_code="+appCode+"&routing=all&dep="+partenza[0].lati+","+partenza[0].long+"&arr="+arrivo[0]+","+arrivo[1]+"&time=2018-11-19T07%3A30%3A00"
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

app.post('/', function(request, response){
    //var reqJS = JSON.parse(request)
    var indPartenza =  request.body.from.replace(" ","+") //il client dovrà fare una post con due campi -> indirizzo e cerco
    var cosaCerchi = request.body.to.replace(" ","+")

    /* var indPartenza = "via+battistini"
    var cosaCerchi = "MC" */

    var urlPart = "https://geocoder.api.here.com/6.2/geocode.json?app_id="+appId+"&app_code="+appCode+"&searchtext="+indPartenza //URL per avere le coordinate dell'indirizzo di partenza
    //var urlPostoCercato = "https://places.cit.api.here.com/places/v1/autosuggest?at=41.9590222,12.4116381&q="+cosaCerchi+"&app_id="+appId+"&app_code="+appCode

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
        .then(resArrivo => JSON.parse(resArrivo).results[0]) // potrebbe restituire più destinazioni quindi prendiamo la prima (la piu vicina) 
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
                response.send(tot)
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



    /* Promise.all([partenza,arrivo])
    .then(risultatoTotale =>urlAssumeValore(risultatoTotale))
    .then(function(urlParam){
        requestPromise(urlParam)
        .then(function(res){
            console.log(res)
            //console.log("arrivo :\n"+arrivo+"\n\n") // dovrebbe funzionare -> arrivo definito anche qua, ci serve per mostrare piu posti dove andare
            var tmp = JSON.parse(res).Res.Connections.Connection
            str1 = ""
            i = 0
            while(str1 != "undefined"){
                try{
                    str1 = tmp[0].Sections.Sec[i].Dep.Transport
                    str2 =tmp[0].Sections.Sec[i].Arr
                    i= i+1
                    console.log(str1)
                    console.log(str2)
                }catch(e){ //catch dell eccezione generata dall uscita dal vettore nel json -> non so come prenderne la lunghezza
                    break;
                }
            }   
        })
    })
    .catch(err  => console.log(err +"\ntot")) */
});

app.listen(PORTA)

// https://gist.github.com/1964797

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('express-logger');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var inspect = require('util-inspect');
var oauth = require('oauth');
var request = require('request')
var Twitter = require('./twitter');
var extend = require('deep-extend');
var app = express();
var VERSION = '1.7.1'

var fs = require('fs');

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./twitter_credentials.json', 'utf8'));
var _twitterConsumerKey = obj._twitterConsumerKey;
var _twitterConsumerSecret = obj._twitterConsumerSecret; 


function consumer() {
    return new oauth.OAuth(
        "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
        _twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://127.0.0.1:8080/sessions/callback", "HMAC-SHA1");
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger({ path: "log/express.log"}));
app.use(cookieParser());
app.use(session({ secret: "very secret", resave: false, saveUninitialized: true}));

app.get('/', function(req, res){
    res.send('Hello World');
});

app.get('/sessions/connect', function(req, res){
    consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
        if (error) {
            console.log(error)
            res.status(500).send("Error getting OAuth request token : " +error.toString());
        } else {
            req.session.oauthRequestToken = oauthToken;
            console.log(oauthToken)
            console.log(oauthTokenSecret)
            req.session.oauthRequestTokenSecret = oauthTokenSecret;
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
        }
    });
});

app.get('/sessions/callback', function(req, res){
    console.log(req)
    var i = 0;
    var oauthRequestToken = ""
    var oauthRequestTokenSecret = ""
    for(var key in req.sessionStore.sessions){ //perchè ha nome variabile -> faccio un for su tutti i campi del json (è solo 1 per questo pezzo)
        var reqS = JSON.parse(req.sessionStore.sessions[key])
        for(key2 in reqS){                      //qui ho tre campi -> primo non server, altri 2 contengono oauthRequestToken e oauthRequestTokenSecret
            //console.log(reqS[key2])
            if(i == 1)
                oauthRequestToken = reqS[key2]
            if(i == 2)
                oauthRequestTokenSecret = reqS[key2]
            i = i+1
        }
    }
    console.log(">>"+oauthRequestToken);
    console.log(">>"+oauthRequestTokenSecret);
    console.log(">>"+req.query.oauth_verifier);
    consumer().getOAuthAccessToken(oauthRequestToken, oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        if (error) {
            console.log(error)
            res.status(500).send("Error getting OAuth access token : " + (error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+(results)+"]");
        } else {
            //consumer().get("https://api.twitter.com/1.1/account/verify_credentials.json", oauthAccessToken, oauthAccessTokenSecret, function (error, data, response) {
            /* status = "prova_post_via_node_server"
            url = "https://api.twitter.com/1.1/statuses/update.json" */
            
            var client = new Twitter({
                consumer_key: _twitterConsumerKey,
                consumer_secret: _twitterConsumerSecret,
                access_token_key: oauthAccessToken,
                access_token_secret: oauthAccessTokenSecret
            });
              
            client.post('statuses/update', {status: 'prova Node server'},  function(error, tweet, response) {
                if(error){ 
                    console.log(error);
                    res.send("NO")
                }
                else{
                    res.send("OK")
                }
            }); 
            
            //questo qua sotto non funziona 
            /* consumer().post(url, oauthAccessToken, oauthAccessTokenSecret, status, '', function (error, data, response) {
                if (!error && response.statusCode == 200) {
                    data = JSON.parse(data);
                    twitterScreenName = data["screen_name"]

                    res.send("OK "+twitterScreenName)
                } else {
                    console.log(error,response,data)
                    //console.log("data is %j", data);
                    res.send("NO")
                }
            }); */
        }
    });
});

app.listen(8080)
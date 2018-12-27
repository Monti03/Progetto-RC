
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

//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(logger({ path: "log/express.log"}));
//app.use(cookieParser());
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
            console.log("1oauthToken "+oauthToken)
            console.log("1oauthTokenSecret"+oauthTokenSecret)
            req.session.oauthRequestTokenSecret = oauthTokenSecret;
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
        }
    });
});

app.get('/sessions/callback', function(req, res){
    //console.log(req)
    var i = 0;
    
    var oauthRequestToken = req.query.oauth_token
    
    console.log(">>2oauthRequestToken "+oauthRequestToken);
    console.log(">>2oauth_verifier "+req.query.oauth_verifier);
    consumer().getOAuthAccessToken(oauthRequestToken, "", req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
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
              
            client.post({status: 'prova Node server'+new Date().getTime()},  function(error, tweet, response) {
                if(error){ 
                    console.log(error+"\n\n");
                    res.send("NO")
                }
                else{
                    console.log("ok\n\n");
                    res.send("OK")
                }
            }); 

        }
    });
});

app.listen(8080)
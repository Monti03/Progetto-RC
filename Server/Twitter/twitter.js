var request = require('request');
var extend = require('deep-extend');

function Twitter(options) {
  //if (!(this instanceof Twitter)) { return new Twitter(options) }
  //console.log("\n\nversion: "+VERSION+"\n\n"

  this.options = options;

  this.authentication_options = {
    oauth: {
      consumer_key: this.options.consumer_key,
      consumer_secret: this.options.consumer_secret,
      token: this.options.access_token_key,
      token_secret: this.options.access_token_secret
    }
  };
  
  this.request = request.defaults(extend(this.authentication_options));

}

Twitter.prototype.post = function(params, callback) {
  //console.log("\n\nparametri: "+params+"\n\n")
  //console.log(this.authentication_options.oauth.consumer_key)
  //console.log(this.authentication_options.oauth.token)

  var options = {
    method: 'post',
    url: "https://api.twitter.com/1.1/statuses/update.json",
    'form':params
  }

  this.request(options, function(error, response, data) {
    // request error
    if (error) {
      return callback(error, data, response);
    }
    data = JSON.parse(data);

    if (data.errors !== undefined) {
      return callback(data.errors, data, response);
    }
    callback(null, data, response);
  });

};


module.exports = Twitter;

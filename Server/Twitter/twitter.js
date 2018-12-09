var request = require('request');
var extend = require('deep-extend');

// Package version
var VERSION = "1.7.1"

function Twitter(options) {
  if (!(this instanceof Twitter)) { return new Twitter(options) }
  console.log("version: "+VERSION)
  this.VERSION = VERSION;

  this.options = extend({
    consumer_key: null,
    consumer_secret: null,
    access_token_key: null,
    access_token_secret: null,
    bearer_token: null,
    rest_base: 'https://api.twitter.com/1.1',
    stream_base: 'https://stream.twitter.com/1.1',
    user_stream_base: 'https://userstream.twitter.com/1.1',
    site_stream_base: 'https://sitestream.twitter.com/1.1',
    media_base: 'https://upload.twitter.com/1.1',
    request_options: {
      headers: {
        Accept: '*/*',
        Connection: 'close',
        'User-Agent': 'node-twitter/' + VERSION
      }
    }
  }, options);

  var authentication_options = {
    oauth: {
      consumer_key: this.options.consumer_key,
      consumer_secret: this.options.consumer_secret,
      token: this.options.access_token_key,
      token_secret: this.options.access_token_secret
    }
  };

  this.request = request.defaults(
    extend(
      this.options.request_options,
      authentication_options
    )
  );

  // Check if Promise present
  this.allow_promise = (typeof Promise === 'function');
}

Twitter.prototype.__request = function(method, path, params, callback) {
  // Build the options to pass to our custom request object
  console.log(params)
  var options = {
    method: 'post',//method.toLowerCase(),  // Request method - get || post
    url: "https://api.twitter.com/1.1/statuses/update.json"//this.__buildEndpoint(path, base) // Generate url
  }
  // Pass form data if post  
  var formKey = 'form';

  options[formKey] = params;

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

Twitter.prototype.post = function(url, params, callback) {
  return this.__request('post', url, params, callback);
};


module.exports = Twitter;

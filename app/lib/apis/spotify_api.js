var path        = require("path");
var querystring = require("querystring");
var underscore  = require("underscore");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var redis       = require(path.join(app.root, "config", "redis"));
var RateLimiter = require(path.join(app.root, "app", "lib", "rate_limiter"));
var HttpJson    = require(path.join(app.root, "app", "lib", "http_json"));
var Spotbox     = require(path.join(app.root, "app", "lib", "spotbox"));

var rateLimiter = new RateLimiter(1000.0 / 10); // 10 requests per second

var apiSettings = {
  host: "ws.spotify.com",
  version: 1
};

function request(opts, params, hollaback) {
  var options = {};
  options.host = apiSettings.host;
  options.path = "/" + opts.type + "/" +  apiSettings.version + "/";

  if (opts.searchType) {
    options.path += opts.searchType;
  }

  options.path += ".json";
  options.path += "?" + querystring.stringify(params);

  rateLimiter.queue(function() {
    HttpJson.request(options, hollaback);
  });
};

function cachedRequest(options, params, cacheKey, hollaback) {
  redis.get(cacheKey, function(error, resultString) {
    if (error) {
      hollaback(error);
    } else if (resultString) {
      hollaback(null, JSON.parse(resultString));
    } else {
      request(options, params, function(error, json) {
        if (error) {
          hollaback(error);
        } else {
          hollaback(null, json);
          redis.set(cacheKey, JSON.stringify(json));
        }
      });
    }
  });
};

var SpotifyApi = function() {};

SpotifyApi.lookup = function(spotifyUri, hollaback) {
  var key = Spotbox.namespace(spotifyUri);
  var options = { type: "lookup" };
  var params  = { uri: spotifyUri };
  cachedRequest(options, params, key, hollaback);
};

SpotifyApi.search = function(type, query, hollaback) {
  var key = Spotbox.namespace("search:" + querystring.escape(query));
  var options = {type: "search", searchType: type};
  var params = {q: query};
  cachedRequest(options, params, key, hollaback);
};

module.exports = SpotifyApi;
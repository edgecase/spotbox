var path        = require("path");
var querystring = require("querystring");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var redis       = require(path.join(app.root, "config", "redis"));
var settings    = require(path.join(app.root, "config", "settings"));
var RateLimiter = require(path.join(app.root, "app", "lib", "rate_limiter"));
var HttpJson    = require(path.join(app.root, "app", "lib", "http_json"));
var Spotbox     = require(path.join(app.root, "app", "lib", "spotbox"));

var rateLimiter = new RateLimiter(1000.0 / 5); // 5 requests per second

var apiSettings = {
  host: "ws.audioscrobbler.com",
  version: "2.0",
  api_key: settings.lastfm.api_key
};

function request(params, hollaback) {
  var options  = {};
  options.host = apiSettings.host;
  options.path = "/" + apiSettings.version + "/"

  params["format"]  = "json";
  params["api_key"] = apiSettings.api_key;
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

var LastFmApi = function() {};

LastFmApi.albumInfo = function(artist, album, hollaback) {
  var key = Spotbox.namespace("lastfm:albuminfo:" + artist + album);
  var params = {
    method: "album.getinfo",
    artist: artist,
    album:  album,
  };
  cachedRequest(options, params, key, function(error, data) {
    if (error) {
      hollaback(error);
    } else {
      var album   = data.album
      var artwork = album && album.image || [];
      hollaback(null, { artwork: artwork });
    }
  });
};

module.exports = LastFmApi;

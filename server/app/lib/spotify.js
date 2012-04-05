var path                  = require("path");
var http                  = require("http");
var querystring           = require("querystring");
var underscore            = require("underscore");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var SpotifyApi            = require(path.join(config.root, "app", "lib", "spotify_api"));

function cache(spotify_uri, metadata) {
  config.redis.set(Spotbox.namespace(spotify_uri), metadata);
};

var Spotify = function() {};

Spotify.retrieve = function(spotify_uri, hollaback) {
  config.redis.get(Spotbox.namespace(spotify_uri), function(error, metadata) {
    if (error) {
      hollaback(error);
    } else if (metadata) {
      hollaback(null, JSON.parse(metadata));
    } else {
      SpotifyApi.lookup(spotify_uri, function(error, metadata) {
        if (error) {
          console.log("Spotify retrieve error:", error)
          hollaback(error);
        } else {
          var track = JSON.parse(metadata).track;
          cache(spotify_uri, JSON.stringify(track));
          hollaback(null, track);
        }
      });
    }
  });
};

Spotify.search = function(query, hollaback) {
  var redis_key = Spotbox.namespace("search:" + querystring.escape(query));
  config.redis.get(redis_key, function(error, metadata) {
    if (metadata) {
      hollaback(error, JSON.parse(metadata));
    } else {
      SpotifyApi.search("track", query, function(error, metadata) {
        if (error) {
          console.log("Spotify search error:", error)
          hollaback(error);
        } else {
          var tracks = JSON.parse(metadata).tracks;
          config.redis.set(redis_key, JSON.stringify(tracks));
          config.redis.expire(redis_key, 3600 * 24 * 7);
          hollaback(null, tracks);
        }
      });
    }
  });
};

module.exports = Spotify;

var path   = require("path");
var http   = require("http");
var config = require(path.join(__dirname, "..", "..", "config"));

var spotifyhost = "ws.spotify.com";
var spotifypath = "/lookup/1/.json";

function namespaceUri(spotifyUri) {
  return "spotify_" + spotifyUri;
};

function request(spotifyUri, hollaback) {
  var metadata = "";
  var options = {
    host: spotifyhost,
    path: spotifypath + "?uri=" + spotifyUri
  };

  http.request(options, function(response) {
    response.on("data", function(chunk) {
      metadata += chunk.toString();
    });
    response.on("end", function() {
      hollaback(null, metadata);
    });
  }).end();
};

function cache(spotifyUri, metadata) {
  config.redis.set(namespaceUri(spotifyUri), metadata);
};

var Spotify = function() {};
Spotify.retrieve = function(spotifyUri, hollaback) {
  config.redis.get(namespaceUri(spotifyUri), function(error, metadata) {
    if (error) {
      hollaback(error);
    } else if (metadata) {
      hollaback(null, JSON.parse(metadata));
    } else {
      request(spotifyUri, function(error, metadata) {
        cache(spotifyUri, metadata);
        hollaback(null, JSON.parse(metadata));
      });
    }
  });
};

module.exports = Spotify;

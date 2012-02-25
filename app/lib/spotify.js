var path       = require("path");
var http       = require("http");
var config     = require(path.join(__dirname, "..", "..", "config"));
var SpotifyApi = require(path.join(config.root, "app", "lib", "spotify_api"));

function namespaceUri(spotifyUri) {
  return "spotify_" + spotifyUri;
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
      SpotifyApi.lookup(spotifyUri, function(error, metadata) {
        cache(spotifyUri, metadata);
        hollaback(null, JSON.parse(metadata));
      });
    }
  });
};

Spotify.search = function(type, query, hollaback) {
  config.redis.get(namespaceUri("search"), function(error, metadata) {
    hollaback(error, JSON.parse(metadata));
  });
  // SpotifyApi.search(type, query, function(error, metadata) {
  //   hollaback(error, JSON.parse(metadata));
  // });
};

module.exports = Spotify;

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
    HttpJson.get(options, hollaback);
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

function standardizeTrack(spTrack) {
  var track            = {album: {}};
  track.type           = "track";
  track.provider       = "spotify";
  track.id             = spTrack.href;
  track.name           = spTrack.name;
  track.track_number   = spTrack["track-number"];
  track.length         = spTrack.length;
  track.album.name     = spTrack.album.name;
  track.album.id       = spTrack.album.href;
  track.album.released = spTrack.album.released;

  track.ids = underscore.reduce(spTrack["external-ids"], function(memo, extId) {
    memo[extId.type] = extId.id;
    return memo;
  }, {spotify: track.id});

  track.artists = underscore.map(spTrack.artists, function(artist) {
    return {name: artist.name, id: artist.href};
  });

  return track;
};

var SpotifyApi = function() {};

SpotifyApi.lookup = function(spotifyUri, hollaback) {
  var key = Spotbox.namespace(spotifyUri);
  var options = { type: "lookup" };
  var params  = { uri: spotifyUri };
  cachedRequest(options, params, key, function(error, metadata) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, standardizeTrack(metadata.track));
    }
  });
};

SpotifyApi.search = function(query, hollaback) {
  var key = Spotbox.namespace("search:" + querystring.escape(query));
  var options = {type: "search", searchType: "track"};
  var params = {q: query};
  cachedRequest(options, params, key, function(error, searchResults) {
    if (error) {
      hollaback(error);
    } else {
      var tracks = underscore.map(searchResults.tracks, function(track) {
        return underscore.extend(standardizeTrack(track), {availability: track.album.availability});
      });
      hollaback(null, tracks);
    }
  });
};

module.exports = SpotifyApi;

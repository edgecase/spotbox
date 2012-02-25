var path                  = require("path");
var http                  = require("http");
var querystring           = require("querystring");
var underscore            = require("underscore");
var AsyncCollectionRunner = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var SpotifyApi            = require(path.join(config.root, "app", "lib", "spotify_api"));

function cache(spotifyUri, metadata) {
  config.redis.set(Spotify.namespace(spotifyUri), metadata);
};

var Spotify = function() {};

Spotify.namespace = function(uri) {
  return "spotify_" + uri;
};

Spotify.retrieve = function(spotifyUri, hollaback) {
  config.redis.get(Spotify.namespace(spotifyUri), function(error, metadata) {
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

Spotify.search = function(query, hollaback) {
  var redisKey = Spotify.namespace("search_" + querystring.escape(query));
  config.redis.get(redisKey, function(error, metadata) {
    if (metadata) {
      hollaback(error, JSON.parse(metadata));
    } else {
      SpotifyApi.search("track", query, function(error, metadata) {
        tracks = underscore.map(JSON.parse(metadata).tracks, function(trackData) {
          var track = {track: trackData}
          config.redis.set(Spotify.namespace(trackData.href), JSON.stringify(track));
          return track;
        });
        config.redis.set(redisKey, JSON.stringify(tracks));
        config.redis.expire(redisKey, 3600 * 24);
        hollaback(error, tracks);
      });
    }
  });
};

Spotify.enqueue = function(spotifyUri, hollaback) {
  Spotify.retrieve(spotifyUri, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      config.redis.rpush(Spotify.namespace("play_queue"), result.track.href, function(error, data) {
        if (error) {
          hollaback(error);
        } else {
          Spotify.getQueue(hollaback);
        }
      });
    }
  });
};

Spotify.getCurrent = function(hollaback) {
  config.redis.get(Spotify.namespace("current"), function(error, trackUri) {
    if (trackUri) {
      Spotify.retrieve(trackUri, hollaback);
    } else {
      hollaback();
    }
  });
};

Spotify.getQueue = function(hollaback) {
  config.redis.lrange(Spotify.namespace("play_queue"), 0, -1, function(error, uris) {
    if (error) {
      hollaback(error);
    } else {
      new AsyncCollectionRunner(uris, Spotify.retrieve).run(hollaback);
    }
  });
};

module.exports = Spotify;

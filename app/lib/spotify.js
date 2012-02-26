var path                  = require("path");
var http                  = require("http");
var querystring           = require("querystring");
var underscore            = require("underscore");
var AsyncCollectionRunner = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var SpotifyApi            = require(path.join(config.root, "app", "lib", "spotify_api"));

function cache(spotifyUri, metadata) {
  config.redis.set(Spotbox.namespace(spotifyUri), metadata);
};

var Spotify = function() {};

Spotify.retrieve = function(spotifyUri, hollaback) {
  config.redis.get(Spotbox.namespace(spotifyUri), function(error, metadata) {
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
  var redisKey = Spotbox.namespace("search:" + querystring.escape(query));
  config.redis.get(redisKey, function(error, metadata) {
    if (metadata) {
      hollaback(error, JSON.parse(metadata));
    } else {
      SpotifyApi.search("track", query, function(error, metadata) {
        tracks = underscore.map(JSON.parse(metadata).tracks, function(trackData) {
          return {track: trackData};
        });
        config.redis.set(redisKey, JSON.stringify(tracks));
        config.redis.expire(redisKey, 3600 * 24 * 7);
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
      config.redis.rpush(Spotbox.namespace("play_queue"), result.track.href, function(error, data) {
        if (error) {
          hollaback(error);
        } else {
          Spotify.getQueue(hollaback);
        }
      });
    }
  });
};

Spotify.getCurrentTrack = function(hollaback) {
  config.redis.get(Spotbox.namespace("current_track"), function(error, trackUri) {
    if (trackUri) {
      Spotify.retrieve(trackUri, hollaback);
    } else {
      hollaback();
    }
  });
};

Spotify.getQueue = function(hollaback) {
  config.redis.lrange(Spotbox.namespace("play_queue"), 0, -1, function(error, uris) {
    if (error) {
      hollaback(error);
    } else {
      new AsyncCollectionRunner(uris, Spotify.retrieve).run(hollaback);
    }
  });
};

Spotify.getRecentlyPlayed = function(hollaback) {
  config.redis.lrange(Spotbox.namespace("recently_played"), 0, -1, function(error, uris) {
    if (error) {
      hollaback(error);
    } else {
      new AsyncCollectionRunner(uris, Spotify.retrieve).run(hollaback);
    }
  });
};

Spotify.getPlaylists = function(hollaback) {
  config.redis.lrange(Spotbox.namespace("playlists"), 0, -1, function(error, uris) {
    if (error) {
      hollaback(error);
    } else {
      var runner = function(uri, hollaback) {
        config.redis.get(Spotbox.namespace(uri), function(error, playlist) {
          if (error) {
            hollaback(error);
          } else {
            hollaback(null, underscore.extend(JSON.parse(playlist), {href: uri}));
          }
        });
      };
      new AsyncCollectionRunner(uris, runner).run(hollaback);
    }
  });
};

Spotify.getCurrentPlaylistUri = function(hollaback) {
  config.redis.get(Spotbox.namespace("current_playlist"), hollaback);
};

Spotify.setCurrentPlaylist = function(uri, hollaback) {
  config.redis.lrange(Spotbox.namespace("playlists"), 0, -1, function(error, uris) {
    if (underscore.include(uris, uri)) {
      config.redis.set(Spotbox.namespace("current_playlist"), uri, function(error) {
        hollaback(error, uri);
      });
    }
  });
};

module.exports = Spotify;

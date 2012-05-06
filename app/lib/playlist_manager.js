var path                  = require("path");
var fs                    = require("fs");
var underscore            = require("underscore");
var AsyncRunnerCollection = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify               = require(path.join(config.root, "app", "lib", "spotify"));
var playlists             = config.settings.spotify.playlists;

var properties = {
  current: null,
  playlists: underscore.reduce(config.settings.spotify.playlists, function(memo, playlist) {
    memo[playlist] = null;
    return memo;
  }, {})
};

var event_hollabacks = {
  current: [],
  playlists: [],
};

function set_property(key, new_value) {
  if (!underscore.isUndefined(properties[key])) {
    if (properties[key] !== new_value) {
      properties[key] = new_value;
      trigger(key);
    }
  }
};

function trigger(key) {
  underscore.each(event_hollabacks[key], function(hollaback) {
    underscore.defer(function() {
      hollaback(underscore.clone(properties));
    });
  });
};

function refresh_playlist_pool(playlist_id, hollaback) {
  var playlist_key = Spotbox.namespace(playlist_id);
  var playlist_pool_key = playlist_key + "_pool";
  config.redis.lrange(playlist_key, 0, -1, function(error, tracks) {
    if (error) {
      hollaback({error: "redis error", message: error});
    } else {
      config.redis.del(playlist_pool_key, function(error) {
        if (error) {
          hollaback({error: "redis error", message: error});
        } else {
          config.redis.rpush(playlist_pool_key, underscore.shuffle(tracks), function(error) {
            if (error) {
              hollaback({error: "redis error", message: error});
            } else {
              hollaback();
            }
          });
        }
      });
    }
  });
};

function get_track(hollaback) {
  var playlist_id = properties.current;
  var playlist_pool_key = Spotbox.namespace(playlist_id + "_pool");
  config.redis.llen(playlist_pool_key, function(error, length) {
    if (error) {
      hollaback({error: "redis error", message: error});
    } else {
      if (length > 0) {
        config.redis.lpop(playlist_pool_key, function(error, track) {
          if (error) {
            hollaback({error: "redis error", message: error});
          } else {
            hollaback(null, track);
          }
        });
      } else {
        refresh_playlist_pool(playlist_id, function(error) {
          if (error) {
            hollaback(error);
          } else {
            hollaback({error: "refresh"});
          }
        });
      }
    }
  });
};

var PlaylistManager = function() {};

PlaylistManager.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

PlaylistManager.random = function(hollaback) {
  if (properties.current) {
    get_track(function(error, track) {
      if (error) {
        if (error.error == "refresh") {
          get_track(hollaback);
        }
      } else {
        hollaback(null, track);
      }
    });
  } else {
    hollaback({error: "not found", message: "no playlist selected"});
  }
};

PlaylistManager.set_playlist_id = function(id) {
  PlaylistManager.load_playlist(id);
  set_property("current", id);
};

PlaylistManager.get_playlist_id = function(hollaback) {
  hollaback(null, properties.current)
};

PlaylistManager.get_playlist = function(id, hollaback) {
  var playlist = properties.playlists[id];
  if (playlist) {
    hollaback(null, properties.playlists[id]);
  } else {
    hollaback({error: "not found", message: "playlist not found"});
  }
};

PlaylistManager.get_playlist_tracks = function(id, hollaback) {
  var playlist_key = Spotbox.namespace(id);
  config.redis.lrange(playlist_key, 0, -1, function(error, tracks) {
    if (error) {
      hollaback(error);
    } else {
      var job_runner = function(element, hollaback) {
        Spotify.retrieve(element, hollaback);
      };
      new AsyncRunnerCollection(tracks, job_runner).run(hollaback);
    }
  });
};

PlaylistManager.get_playlists = function(hollaback) {
  hollaback(null, properties.playlists);
};

PlaylistManager.load_playlists = function() {
  // wait until zqm is ready to send messages. Even though we are using a
  // blocking bind, it appears to not work if messages are sent immediately.
  // Bug?
  setTimeout(function() {
    underscore.each(properties.playlists, function(value, key) {
      PlaylistManager.load_playlist(key);
    });
  }, 537); // Magic numbers!
};

PlaylistManager.load_playlist = function(id) {
  config.pub_socket.send(Spotbox.namespace("players:spotify::loadPlaylist::" + id));
};

PlaylistManager.sync_playlist = function(playlist_data) {
  var key = Spotbox.namespace(playlist_data.id);
  properties.playlists[playlist_data.id] = playlist_data.name;
  trigger("playlists");

  config.redis.del(key, function() {
    config.redis.rpush(Spotbox.namespace(playlist_data.id), playlist_data.tracks);
  });
};

module.exports = PlaylistManager;

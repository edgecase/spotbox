var path          = require("path");
var fs            = require("fs");
var underscore    = require("underscore");
var AsyncRunner   = require("async_collection_runner");
var secure_random = require("secure_random");
var config        = require(path.join(__dirname, "..", "..", "config"));
var Spotbox       = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify       = require(path.join(config.root, "app", "lib", "spotify"));

var properties = {
  current: null,
  tracks: [],
  playlists: {
    "spotify:user:mikedoel:playlist:05m1Zj1ixCNoCb3kJd5of7": null,
    "spotify:user:felixflores:playlist:69OIU8YTz5g9XzKKv53vlg": null
  },
};

var event_hollabacks = {
  current: [],
  tracks: [],
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

function get_track(hollaback) {
  if (properties.tracks.length > 0) {
    secure_random.getRandomInt(0, properties.tracks.length, function(error, value) {
      if (error) {
        hollaback(error);
      } else {
        var id = properties.tracks[value];
        hollaback(null, id);
      }
    });
  } else {
    hollaback({error: "not found", message: "no tracks available"});
  }
};

var PlaylistManager = function() {};

PlaylistManager.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

PlaylistManager.random = function(hollaback) {
  if (properties.tracks.length === 0) {
    PlaylistManager.refresh_playlist(function() {
      get_track(hollaback);
    });
  } else {
    get_track(hollaback);
  }
};

PlaylistManager.remove_track = function(track) {
  set_property("tracks", underscore.without(properties.tracks, track));
};

PlaylistManager.set_playlist_id = function(id) {
  PlaylistManager.load_playlist(id);
  set_property("current", id);
  PlaylistManager.refresh_playlist(function() {});
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
  config.pub_socket.send(Spotbox.namespace("players:spotify::load_playlist::" + id));
};

PlaylistManager.sync_playlist = function(playlist_data) {
  var key = Spotbox.namespace(playlist_data.id);
  properties.playlists[playlist_data.id] = playlist_data.name;
  trigger("playlists");

  config.redis.del(key, function() {
    config.redis.rpush(Spotbox.namespace(playlist_data.id), playlist_data.tracks, function() {
      PlaylistManager.refresh_playlist(function() {});
    });
  });
};

PlaylistManager.refresh_playlist = function(hollaback) {
  config.redis.lrange(Spotbox.namespace(properties.current), 0, -1, function(error, tracks) {
    set_property("tracks", underscore.shuffle(tracks));
    hollaback();
  });
};

module.exports = PlaylistManager;

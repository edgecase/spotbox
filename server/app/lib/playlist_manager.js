var path        = require("path");
var fs          = require("fs");
var underscore  = require("underscore");
var AsyncRunner = require("async_collection_runner");
var srandom     = require("secure_random");
var config      = require(path.join(__dirname, "..", "..", "config"));
var Spotbox     = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify     = require(path.join(config.root, "app", "lib", "spotify"));

var properties = {
  current: null,
  tracks: [],
  known_playlists: [
    "spotify:user:mikedoel:playlist:05m1Zj1ixCNoCb3kJd5of7",
    "spotify:user:felixflores:playlist:69OIU8YTz5g9XzKKv53vlg"
  ],
};

var event_hollabacks = {
  current: [],
  tracks: [],
  known_playlists: [],
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

var PlaylistManager = function() {};

PlaylistManager.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

PlaylistManager.next = function() {
  srandom.getRandomInt(0, properties.tracks.length, function(error, value) {
    var uri = properties.tracks[value];
    config.pub_socket.send(Spotbox.namespace("players:spotify::play::" + uri));
  });
};

PlaylistManager.set_current = function(uri) {
  set_property("current", uri);
  config.redis.lrange(Spotbox.namespace(uri), 0, -1, function(error, tracks) {
    set_property("tracks", tracks);
  });
};

PlaylistManager.get_playlist_uri = function() {
  return underscore.clone(properties.current);
};

PlaylistManager.get_playlist = function(uri, hollaback) {
  config.redis.lrange(Spotbox.namespace("playlists"), 0, -1, function(error, playlists) {
    if (error) {
      hollaback(error);
    } else {
      var playlist_objs = underscore.map(playlists, function(str) { return JSON.parse(str) });
      var playlist = underscore.find(playlist_objs, function(playlist) {
        return playlist.url === uri;
      });
      hollaback(null, playlist);
    }
  });
};

PlaylistManager.get_playlists = function(hollaback) {
  config.redis.lrange(Spotbox.namespace("playlists"), 0, -1, function(error, playlists) {
    if (error) {
      hollaback(error);
    } else {
      var playlist_objs = underscore.map(playlists, function(str) { return JSON.parse(str) });
      hollaback(null, playlist_objs);
    }
  });
};

PlaylistManager.load_playlists = function() {
  underscore.each(properties.known_playlists, function(playlist_url) {
    setTimeout(function() {
      config.pub_socket.send(Spotbox.namespace("players:spotify::load_playlist::" + playlist_url));
    }, 100);
  });
};

PlaylistManager.sync_playlist = function(playlist_data) {
  config.redis.rpush(Spotbox.namespace("playlists"), JSON.stringify({
    name: playlist_data.name,
    url : playlist_data.url
  }));

  underscore.each(playlist_data.tracks, function(track) {
    config.redis.rpush(Spotbox.namespace(playlist_data.url), track);
  });
};

module.exports = PlaylistManager;

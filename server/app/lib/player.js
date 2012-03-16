var path                  = require("path");
var fs                    = require("fs");
var underscore            = require("underscore");
var AsyncCollectionRunner = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify               = require(path.join(config.root, "app", "lib", "spotify"));

var properties = {
  state: "stopped",
  track: null,
  queue: [],
  recent: [],
  progress: "0",
  playlist: null
};

var event_hollabacks = {
  state: [],
  track: [],
  queue: [],
  recent: [],
  progress: [],
  playlist: []
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

var Player = function() {};

Player.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

Player.play = function(uri) {
  if (uri) {
    config.pub_socket.send(Spotbox.namespace("players:spotify::play::" + uri));
  } else if (properties.state === "paused") {
    config.pub_socket.send(Spotbox.namespace("players:spotify::unpause"));
  } else {
    Player.next();
  }
};

Player.stop = function() {
  config.pub_socket.send(Spotbox.namespace("players:spotify::stop"));
};

Player.pause = function() {
  config.pub_socket.send(Spotbox.namespace("players:spotify::pause"));
};

Player.next = function() {
  var uri = properties.queue.shift() || "spotify:track:4qjqO5m5e5vebk9upd7xUU";
  config.pub_socket.send(Spotbox.namespace("players:spotify::play::" + uri));
};

Player.set_state = function(state) {
  set_property("state", state);
};

Player.get_state = function(hollaback) {
  hollaback(null, { state: properties.state });
};

Player.add_to_queue = function(uri) {
  properties.queue.push(uri);
  trigger("queue");
};

Player.get_queue = function(hollaback) {
  new AsyncCollectionRunner(properties.queue, Spotify.retrieve).run(hollaback);
};

Player.add_to_recent = function(uri) {
  properties.recent.push(uri);
  trigger("recent");
};

Player.get_recent = function(hollaback) {
  new AsyncCollectionRunner(properties.recent, Spotify.retrieve).run(hollaback);
};

Player.set_track = function(uri) {
  set_property("track", uri);
};

Player.get_track = function(hollaback) {
  if (properties.track) {
    Spotify.retrieve(properties.track, hollaback);
  }
};

Player.set_progress = function(progress) {
  set_property("progress", progress);
};

Player.set_playlist_uri = function(uri) {
  set_property("playlist", uri);
};

Player.get_playlist_uri = function() {
  return underscore.clone(properties.playlist);
};

Player.get_playlist = function(uri, hollaback) {
  config.redis.get(Spotbox.namespace(uri), function(error, playlist) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, underscore.extend(JSON.parse(playlist), {href: uri}));
    }
  });
};

Player.get_playlists = function(hollaback) {
  config.redis.lrange(Spotbox.namespace("playlists"), 0, -1, function(error, uris) {
    if (error) {
      hollaback(error);
    } else {
      new AsyncCollectionRunner(uris, Player.get_playlist).run(hollaback);
    }
  });
};

module.exports = Player;

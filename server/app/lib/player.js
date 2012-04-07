var path                  = require("path");
var fs                    = require("fs");
var underscore            = require("underscore");
var AsyncCollectionRunner = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify               = require(path.join(config.root, "app", "lib", "spotify"));
var PlaylistManager       = require(path.join(config.root, "app", "lib", "playlist_manager"));

var RECENT_TRACK_SIZE = 25;
var QUOREM_SIZE = 3;

if (config.env === "development") {
  // Skip tracks without needing a quorem in dev mode
  QUOREM_SIZE = 1;
}

var properties = {
  state: "stopped",
  track: null,
  queue: [],
  recent: [],
  progress: "0",
  next_votes: {}
};

var event_hollabacks = {
  state: [],
  track: [],
  queue: [],
  recent: [],
  progress: [],
  next_votes: []
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

function play(id) {
  config.pub_socket.send(Spotbox.namespace("players:spotify::play::" + id));
  PlaylistManager.remove_track(id);
  if (properties.track) {
    add_to_recent(properties.track);
  }
  set_property("next_votes", {});
}

function play_next() {
  if (properties.queue.length > 0) {
    id = properties.queue.shift();
    trigger("queue");
    play(id);
  } else {
    PlaylistManager.random(function(error, id) {
      if (error) {
        console.log(error);
      } else {
        play(id);
      }
    });
  }
};

function add_to_recent(id) {
  properties.recent.unshift(id);
  properties.recent.slice(0, RECENT_TRACK_SIZE);
  trigger("recent");
  Spotify.retrieve(id, function(error, track) {
    if (error) {
      console.log("error saving recent track", error);
    } else {
      config.db.save(underscore.extend(track, {type: "played_track"}), function () {});
    }
  });
};

var Player = function() {};

Player.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

Player.play = function(id) {
  if (properties.state === "paused") {
    config.pub_socket.send(Spotbox.namespace("players:spotify::unpause"));
  } else {
    if (id) {
      play(id);
    } else {
      play_next();
    }
  }
};

Player.stop = function() {
  config.pub_socket.send(Spotbox.namespace("players:spotify::stop"));
};

Player.pause = function() {
  config.pub_socket.send(Spotbox.namespace("players:spotify::pause"));
};

Player.set_state = function(state) {
  set_property("state", state);
};

Player.get_state = function(hollaback) {
  hollaback(null, { state: properties.state });
};

Player.next_vote = function(id) {
  properties.next_votes[id] = true;
  if (underscore.size(properties.next_votes) >= QUOREM_SIZE) {
    play_next();
  }
  trigger("next_votes");
};

Player.get_next_votes = function(hollaback) {
  hollaback(null, underscore.size(properties.next_votes));
};

Player.add_to_queue = function(id) {
  properties.queue.push(id);
  trigger("queue");
};

Player.remove_from_queue = function(id) {
  set_property("queue", underscore.filter(properties.queue, function(track) {
    return track !== id
  }));
};

Player.get_queue = function(hollaback) {
  new AsyncCollectionRunner(properties.queue, Spotify.retrieve).run(hollaback);
};

Player.get_recent = function(hollaback) {
  new AsyncCollectionRunner(properties.recent, Spotify.retrieve).run(hollaback);
};

Player.set_track = function(id) {
  set_property("track", id);
};

Player.get_track = function(hollaback) {
  if (properties.track) {
    Spotify.retrieve(properties.track, hollaback);
  }
};

Player.set_progress = function(progress) {
  set_property("progress", progress);
};

module.exports = Player;

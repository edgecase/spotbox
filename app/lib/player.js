var path                  = require("path");
var fs                    = require("fs");
var underscore            = require("underscore");
var AsyncCollectionRunner = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify               = require(path.join(config.root, "app", "lib", "spotify"));
var PlaylistManager       = require(path.join(config.root, "app", "lib", "playlist_manager"));

var HISTORY_LIMIT = 25;
var QUOREM_SIZE = 3;
var PLAYED_THRESHOLD = 0.5; // minimum fraction of song that has been played in order to mark as played

if (config.env === "development") {
  // Skip tracks without needing a quorem in dev mode
  QUOREM_SIZE = 1;
}

var properties = {
  state: "stopped",
  track: null,
  queue: [],
  progress: "0",
  next_votes: {}
};

var event_hollabacks = {
  state: [],
  track: [],
  queue: [],
  played: [],
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
  var prev_id = properties.track;
  var prev_progress = properties.progress;
  config.pub_socket.send(Spotbox.namespace("players:spotify::play::" + id));
  set_property("next_votes", {});

  if (prev_id) {
    Spotify.retrieve(prev_id, function(error, metadata) {
      if (error) {
        console.log(error);
      } else {
        if (prev_progress > (metadata.length * PLAYED_THRESHOLD)) {
          save_played(prev_id);
        } else {
          save_skipped(prev_id);
        }
      }
    });
  }
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

function save_played(id) {
  Spotify.retrieve(id, function(error, track) {
    if (error) {
      console.log("error saving played track", error);
    } else {
      underscore.extend(track, {type: "played_track", created_at: new Date()});
      config.db.save(track, function (error, response) {
        trigger("played");
      });
    }
  });
};

function save_skipped(id) {
  Spotify.retrieve(id, function(error, track) {
    if (error) {
      console.log("error saving skipped track", error);
    } else {
      underscore.extend(track, {type: "skipped_track", created_at: new Date()});
      config.db.save(track, function (error, response) {});
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
  if (!underscore.include(properties.queue, id)) {
    properties.queue.push(id);
    trigger("queue");
  }
};

Player.get_queue = function(hollaback) {
  new AsyncCollectionRunner(properties.queue, Spotify.retrieve).run(hollaback);
};

Player.set_track = function(id) {
  Spotify.retrieve(id, function(error, track) {
    if (!error) {
      set_property("track", id);
    }
  });
};

Player.get_track = function(hollaback) {
  if (properties.track) {
    Spotify.retrieve(properties.track, hollaback);
  }
};

Player.set_progress = function(progress) {
  set_property("progress", progress);
};

Player.get_played_tracks = function(hollaback) {
  config.db.view("played_tracks/recent", {limit: HISTORY_LIMIT, descending: true }, function(error, response) {
    if (error) {
      hollaback({error: "couchdb error", message: error});
    } else {
      hollaback(null, underscore.pluck(response, "value"));
    }
  });
};

module.exports = Player;

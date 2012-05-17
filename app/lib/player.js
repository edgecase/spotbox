var path            = require("path");
var fs              = require("fs");
var underscore      = require("underscore");
var app             = require(path.join(__dirname, "..", "..", "config", "app"));
var db              = require(path.join(app.root, "config", "database"));
var Spotbox         = require(path.join(app.root, "app", "lib", "spotbox"));
var Spotify         = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Itunes          = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var PlaylistManager = require(path.join(app.root, "app", "lib", "playlist_manager"));

var QUOREM_SIZE = 4;
var PLAYED_THRESHOLD = 0.5;

if (app.env === "development") {
  QUOREM_SIZE = 1;
}

var currentPlayer = null;

var properties = {
  state: "stopped",
  track: null,
  queue: [],
  progress: "0",
  votes: {}
};

var eventHollabacks = {
  state: [],
  track: [],
  queue: [],
  progress: [],
  votes: []
};

function setProperty(key, newValue) {
  if (!underscore.isUndefined(properties[key])) {
    if (properties[key] !== newValue) {
      properties[key] = newValue;
      trigger(key);
    }
  }
};

function trigger(key) {
  underscore.each(eventHollabacks[key], function(hollaback) {
    underscore.defer(function() {
      hollaback(underscore.clone(properties));
    });
  });
};

function setPlayerBindings(player) {
  player.on("state", function(properties) {
    if (player === currentPlayer) {
      setProperty("state", properties.state);
    }
  });
  player.on("track", function(properties) {
    if (player === currentPlayer) {
      setProperty("track", properties);
    }
  });
  player.on("progress", function(properties) {
    if (player === currentPlayer) {
      setProperty("progress", properties.progress);
    }
  });
  player.on("endOfTrack", function(progress) {
    if (player === currentPlayer) {
      player.stop(function() {
        playNext(function() {});
      });
    }
  });
};

function metadata(id, hollaback) {
  var player = getPlayerForId(id);
  player.metadata(id, hollaback);
};

function getPlayerForId(id) {
  var player;
  if (id.match(/itunes/)) {
    player = Itunes;
  } else {
    player = Spotify;
  }
  return player;
};

function markPlayed(track) {
  db.collection("played", function(error, collection) {
    collection.insert(track, {});
  });
  db.collection("pool", function(error, collection) {
    collection.update({id: track.id}, track, {upsert: true});
  });
};

function markSkipped(track) {
  db.collection("skipped", function(error, collection) {
    collection.insert(track, {});
  });
  db.collection("pool", function(error, collection) {
    collection.findAndModify({id: track.id}, [["_id","asc"]], {remove: true}, function() {});
  });
};

function stopCurrent(hollaback) {
  if (currentPlayer) {
    currentPlayer.stop(hollaback);
  } else {
    hollaback(null);
  }
};

function pauseCurrent(hollaback) {
  if (currentPlayer) {
    currentPlayer.pause(hollaback);
  } else {
    hollaback(null);
  }
};

function play(id, hollaback) {
  var previousTrack = properties.track;
  var previousProgress = properties.progress;
  setProperty("nextVotes", {});

  if (previousTrack) {
    if (previousProgress > (previousTrack.length * PLAYED_THRESHOLD)) {
      markPlayed(previousTrack);
    } else {
      markSkipped(previousTrack);
    }
  }

  stopCurrent(function(error) {
    var player = getPlayerForId(id);
    if (error) {
      hollaback(error);
    } else {
      setProperty("state", "playing");
      currentPlayer = player;
      player.play(id, hollaback);
    }
  });
}

function playNext(hollaback) {
  if (properties.queue.length > 0) {
    var id = properties.queue.shift().id;
    trigger("queue");
    play(id, hollaback);
  } else {
    PlaylistManager.next(function(error, id) {
      if (error) {
        hollaback(error);
      } else {
        play(id, hollaback);
      }
    });
  }
};


var Player = function() {};

Player.play = function(id, hollaback) {
  if (properties.state === "paused") {
    Player.pause(hollaback);
  } else {
    if (id) {
      play(id, hollaback);
    } else {
      playNext(hollaback);
    }
  }
};

Player.stop = function(hollaback) {
  stopCurrent(hollaback);
};

Player.pause = function() {
  pauseCurrent(hollaback);
};

Player.vote = function(id) {
  properties.votes[id] = true;
  if (underscore.size(properties.votes) >= QUOREM_SIZE) {
    playNext(function() {});
  }
  trigger("votes");
};

Player.enqueue = function(id, hollaback) {
  metadata(id, function(error, track) {
    if (error) {
      hollaback(error);
    } else {
      var exists = underscore.find(properties.queue, function(t) {
        return t.id === id
      });
      if (!exists) {
        properties.queue.push(track);
        hollaback(null, track);
      } else {
        hollaback({error: "Player enqueue", message: "duplicate"});
      }
    }
  });
};

Player.properties = function() {
  return JSON.parse(JSON.stringify(properties));
};

Player.on = function(key, hollaback) {
  eventHollabacks[key].push(hollaback);
};

setPlayerBindings(Itunes);
setPlayerBindings(Spotify);

module.exports = Player;

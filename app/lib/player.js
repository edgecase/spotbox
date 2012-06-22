var path         = require("path");
var fs           = require("fs");
var underscore   = require("underscore");
var app          = require(path.join(__dirname, "..", "..", "config", "app"));
var db           = require(path.join(app.root, "config", "database"));
var EventedState = require(path.join(app.root, "app", "lib", "evented_state"));
var Spotbox      = require(path.join(app.root, "app", "lib", "spotbox"));
var Spotify      = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Itunes       = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Airfoil      = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));
var TrackManager = require(path.join(app.root, "app", "lib", "track_manager"));


var currentPlayer = null;
var state = new EventedState({
  state: "stopped",
  track: null,
  progress: "0"
});

function setPlayerBindings(player) {
  player.on("state", function(properties) {
    if (player === currentPlayer) {
      state.set("state", properties.state);
    }
  });
  player.on("track", function(properties) {
    if (player === currentPlayer) {
      state.set("track", properties.track);
    }
  });
  player.on("progress", function(properties) {
    if (player === currentPlayer) {
      state.set("progress", properties.progress);
    }
  });
  player.on("endOfTrack", function(progress) {
    if (player === currentPlayer) {
      player.pause(function() {
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
  } else if (id.match(/spotify/)) {
    player = Spotify;
  }
  return player;
};

function unpauseCurrent(hollaback) {
  if (currentPlayer) {
    currentPlayer.unpause(hollaback);
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

function play(track, hollaback) {
  var previousTrack = state.properties.track;
  var previousProgress = parseInt(state.properties.progress, 10);

  if (previousTrack) {
    if (previousProgress === 0 || previousProgress >= (previousTrack.length - 5)) {
      TrackManager.markPlayed(previousTrack, function() {});
    }
  }

  pauseCurrent(function(error) {
    if (error) {
      hollaback(error);
    } else {
      var player = getPlayerForId(track.id);
      Airfoil.setSource(player, function(error) {
        state.set("state", "playing");
        currentPlayer = player;
        player.play(track, hollaback);
      });
    }
  });
};

function playNext(hollaback) {
  TrackManager.next(function(error, track) {
    if (error) {
      hollaback(error);
    } else {
      play(track, hollaback);
    }
  });
};


var Player = function() {};

Player.play = function(hollaback) {
  if (state.properties.track) {
    Player.unpause(hollaback);
  } else {
    playNext(hollaback);
  }
};

Player.next = function(hollaback) {
  playNext(hollaback);
};

Player.pause = function(hollaback) {
  pauseCurrent(hollaback);
};

Player.unpause = function(hollaback) {
  unpauseCurrent(hollaback);
};

Player.properties = function() {
  return JSON.parse(JSON.stringify(state.properties));
};

Player.on = function(key, hollaback) {
  state.on(key, hollaback);
};

setPlayerBindings(Itunes);
setPlayerBindings(Spotify);

module.exports = Player;

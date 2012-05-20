var path            = require("path");
var fs              = require("fs");
var underscore      = require("underscore");
var app             = require(path.join(__dirname, "..", "..", "config", "app"));
var db              = require(path.join(app.root, "config", "database"));
var Spotbox         = require(path.join(app.root, "app", "lib", "spotbox"));
var Spotify         = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Itunes          = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Airfoil         = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));
var TrackManager    = require(path.join(app.root, "app", "lib", "track_manager"));

var QUOREM_SIZE = 4;

if (app.env === "development") {
  QUOREM_SIZE = 1;
}

var currentPlayer = null;

var properties = {
  state: "stopped",
  track: null,
  progress: "0",
  votes: {}
};

var eventHollabacks = {
  state: [],
  track: [],
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
      setProperty("track", properties.track);
    }
  });
  player.on("progress", function(properties) {
    if (player === currentPlayer) {
      setProperty("progress", properties.progress);
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
  var previousTrack = properties.track;
  var previousProgress = parseInt(properties.progress, 10);
  setProperty("nextVotes", {});

  if (previousTrack) {
    if (previousProgress === 0 ||previousProgress >= (previousTrack.length - 5)) {
      TrackManager.markPlayed(previousTrack, {}, function() {});
    } else {
      TrackManager.markSkipped(previousTrack, {progress: previousProgress}, function() {});
    }
  }

  pauseCurrent(function(error) {
    if (error) {
      hollaback(error);
    } else {
      var player = getPlayerForId(track.id);
      Airfoil.setSource(player, function(error) {
        setProperty("state", "playing");
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
  playNext(hollaback);
};

Player.pause = function(hollaback) {
  pauseCurrent(hollaback);
};

Player.unpause = function(hollaback) {
  unpauseCurrent(hollaback);
};

Player.vote = function(id) {
  properties.votes[id] = true;
  if (underscore.size(properties.votes) >= QUOREM_SIZE) {
    playNext(function() {});
  }
  trigger("votes");
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

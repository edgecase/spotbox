var path         = require("path");
var http         = require("http");
var querystring  = require("querystring");
var underscore   = require("underscore");
var AsyncRunner  = require("async_runner");
var app          = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var EventedState = require(path.join(app.root, "app", "lib", "evented_state"));
var db           = require(path.join(app.root, "config", "database"));
var SpotifyApi   = require(path.join(app.root, "app", "lib", "apis", "spotify_api"));
var Applescript  = require(path.join(app.root, "app", "lib", "applescript"));

var pollingId = null;

var state = new EventedState({
  track: null,
  state: "stopped",
  intendedState: "stopped",
  progress: 0
}, ["endOfTrack"]);

function exec(applescriptString, hollaback) {
  var str = "tell application \"Spotify\"\n" + applescriptString + "\nend tell"
  Applescript.run(str, hollaback);
};

function getTrackId(hollaback) {
  exec("id of current track", hollaback);
};

function getState(hollaback) {
  exec("player state", hollaback);
};

function getProgress(hollaback) {
  exec("player position", hollaback);
};

// Note: this is complicated because of the odd behavior of spotify.
// Do not change this method unless you know what you are doing.
function updateStatus() {
  getState(function(error, playerState) {
    if (error) {
      hollaback(error);
    } else {
      // Check if player stopped by itself
      if (state.properties.state === "playing" && state.properties.intendedState === "playing" && playerState === "stopped") {
        state.set("intendedState", "paused");
        state.trigger("endOfTrack");
      }
      state.set("state", playerState);
      if (playerState !== "paused" && playerState !== "stopped") {
        getTrackId(function(error, trackId) {
          if (!error) {
            // Check if player automatically went to the next track
            if (state.properties.track.id !== trackId) {
              if (state.properties.intendedState === "playing") {
                Spotify.pause(function() {
                  state.trigger("endOfTrack");
                });
              }
            }
          }
        });
        getProgress(function(error, progress) {
          if (!error && progress !== "missing value") {
            state.set("progress", progress);
          }
        });
      }
    }
  });
};


var Spotify = function() {};

Spotify.playerName = "spotify";

Spotify.launch = function(hollaback) {
  var runner = new AsyncRunner(hollaback);
  exec("launch", function(error) {
    if (error) {
      hollaback(error);
    } else {
      runner.run({}, [
        function(element, hollaback) {
          exec("set sound volume to 50", hollaback);
        },
        function(element, hollaback) {
          Spotify.pause(hollaback);
        }
      ]);
    }
  });
};

Spotify.metadata = function(id, hollaback) {
  SpotifyApi.lookup(id, hollaback);
};

Spotify.play = function(track, hollaback) {
  state.set("intendedState", "playing");
  state.set("track", track);
  exec("play track \"" + track.id + "\"", hollaback);
};

Spotify.pause = function(hollaback) {
  state.set("intendedState", "paused");
  exec("pause", hollaback);
};

Spotify.unpause = function(hollaback) {
  state.set("intendedState", "playing");
  exec("play", hollaback);
};

Spotify.search = function(query, hollaback) {
  SpotifyApi.search(query, hollaback);
};

Spotify.on = function(key, hollaback) {
  state.on(key, hollaback);
};

// Poll to trigger events
state.on("state", function(properties) {
  if (properties.state === "playing" && !pollingId) {
    // start polling
    pollingId = setInterval(updateStatus, 250);
  }

  if (properties.state !== "playing" && properties.intendedState !== "playing") {
    if (pollingId) {
      // stop polling
      clearInterval(pollingId);
      pollingId = null;
    }
  }
});

state.on("intendedState", function(properties) {
  if (properties.intendedState === "playing") {
    if (!pollingId) {
      pollingId = setInterval(updateStatus, 250);
    }
  }
});

module.exports = Spotify;

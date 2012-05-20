var path        = require("path");
var http        = require("http");
var querystring = require("querystring");
var underscore  = require("underscore");
var AsyncRunner = require("async_runner");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var db          = require(path.join(app.root, "config", "database"));
var SpotifyApi  = require(path.join(app.root, "app", "lib", "apis", "spotify_api"));
var Applescript = require(path.join(app.root, "app", "lib", "applescript"));

var pollingId = null;
var properties = {
  track: null,
  state: "paused",
  intendedState: "paused",
  progress: 0
}

var eventHollabacks = {
  track: [],
  state: [],
  intendedState: [],
  endOfTrack: [],
  progress: []
}

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
  getState(function(error, state) {
    if (error) {
      hollaback(error);
    } else {
      // Check if player stopped by itself
      if (properties.state === "playing" && properties.intendedState === "playing" && state === "stopped") {
        setProperty("intendedState", "paused");
        trigger("endOfTrack");
      }
      setProperty("state", state);
      if (state !== "paused" && state !== "stopped") {
        getTrackId(function(error, trackId) {
          if (!error) {
            // Check if player automatically went to the next track
            if (properties.track.id !== trackId) {
              if (properties.intendedState === "playing") {
                Spotify.stop(function() {
                  trigger("endOfTrack");
                });
              }
            }
          }
        });
        getProgress(function(error, progress) {
          if (!error && progress !== "missing value") {
            setProperty("progress", progress);
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
          Spotify.stop(hollaback);
        }
      ]);
    }
  });
};

Spotify.metadata = function(id, hollaback) {
  SpotifyApi.lookup(id, hollaback);
};

Spotify.play = function(track, hollaback) {
  setProperty("intendedState", "playing");
  setProperty("track", track);
  exec("play track \"" + track.id + "\"", hollaback);
};

Spotify.pause = function() {
  if (properties.state === "paused") {
    setProperty("intendedState", "playing");
    exec("play", hollaback);
  } else if (properties.state === "playing") {
    setProperty("intendedState", "paused");
    exec("pause", hollaback);
  } else {
    hollaback();
  }
};

Spotify.stop = function(hollaback) {
  setProperty("intendedState", "paused");
  exec("pause", hollaback);
};

Spotify.search = function(query, hollaback) {
  SpotifyApi.search(query, hollaback);
};

Spotify.on = function(key, hollaback) {
  eventHollabacks[key].push(hollaback);
};

// Poll to trigger events
Spotify.on("state", function(properties) {
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

Spotify.on("intendedState", function(properties) {
  if (properties.intendedState === "playing") {
    if (!pollingId) {
      pollingId = setInterval(updateStatus, 250);
    }
  }
});

module.exports = Spotify;

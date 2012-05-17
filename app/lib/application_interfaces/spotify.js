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

function standardizeTrack(spTrack) {
  var track            = {album: {}};
  track.type           = "track";
  track.provider       = "spotify";
  track.id             = spTrack.href;
  track.name           = spTrack.name;
  track.track_number   = spTrack["track-number"];
  track.length         = spTrack.length;
  track.album.name     = spTrack.album.name;
  track.album.id       = spTrack.album.href;
  track.album.released = spTrack.album.released;

  track.ids = underscore.reduce(spTrack["external-ids"], function(memo, extId) {
    memo[extId.type] = extId.id;
    return memo;
  }, {spotify: track.id});

  track.artists = underscore.map(spTrack.artists, function(artist) {
    return {name: artist.name, id: artist.href};
  });

  return track;
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

function updateStatus() {
  getState(function(error, state) {
    if (error) {
      hollaback(error);
    } else {
      if (properties.state === "playing" && properties.intendedState === "playing" && state === "paused") {
        setProperty("intendedState", "paused");
        trigger("endOfTrack");
      }
      setProperty("state", state);
      if (state !== "paused") {
        getProgress(function(error, progress) {
          if (!error && progress !== "missing value") {
            setProperty("progress", progress);
          }
        });
        getTrackId(function(error, trackId) {
          if (!error) {
            if (!properties.track || properties.track.id !== trackId) {
              Spotify.metadata(trackId, function(error, track) {
                if (error) {
                  hollaback(error);
                } else {
                  setProperty("track", track);
                }
              });
            }
          }
        });
      }
    }
  });
};


var Spotify = function() {};

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
  db.collection("pool", function(error, collection) {
    if (error) {
      hollaback(error);
    } else {
      var cursor = collection.find({id: id}, {limit: 1});
      cursor.toArray(function(error, tracks) {
        if (error) {
          hollaback(error);
        } else if (tracks.length === 1) {
          hollaback(null, tracks[0])
        } else {
          SpotifyApi.lookup(id, function(error, meta) {
            if (error) {
              hollaback(error);
            } else {
              hollaback(null, standardizeTrack(meta.track));
            }
          });
        }
      });
    }
  });
};

Spotify.play = function(id, hollaback) {
  setProperty("intendedState", "playing");
  exec("play track \"" + id + "\"", hollaback);
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
  SpotifyApi.search("track", query, function(error, results) {
    if (error) {
      hollaback(error);
    } else {
      var tracks = underscore.map(results.tracks, function(track) {
        // Availability check is relatively expensive, decentralize the work by pushing that to the client.
        return underscore.extend(standardizeTrack(track), {availability: track.album.availability});
      });
      hollaback(null, tracks);
    }
  });
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

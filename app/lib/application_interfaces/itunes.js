var path        = require("path");
var underscore  = require("underscore");
var AsyncRunner = require("async_runner");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var db          = require(path.join(app.root, "config", "database"));
var Applescript = require(path.join(app.root, "app", "lib", "applescript"));

var pollingId = null;
var properties = {
  track: null,
  state: "stopped",
  intendedState: "stopped",
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
  var str = "tell application \"iTunes\"\n" + applescriptString + "\nend tell"
  Applescript.run(str, hollaback);
};

// Pyramid of doom
function lookup(id, hollaback) {
  var itunesId = id.split(":")[1];
  var baseCommand = "set mytrack to some track whose database ID is " + itunesId + "\n";
  exec(baseCommand + "name of mytrack", function(error, name) {
    exec(baseCommand + "track number of mytrack", function(error, trackNumber) {
      exec(baseCommand + "artist of mytrack", function(error, artist) {
        exec(baseCommand + "album of mytrack", function(error, albumName) {
          exec(baseCommand + "year of mytrack", function(error, year) {
            exec(baseCommand + "duration of mytrack", function(error, duration) {
              if (error) {
                hollaback(error);
              } else {
                var data = {
                  type: "track",
                  provider: "itunes",
                  id: id,
                  ids: {itunes: id},
                  name: name,
                  track_number: trackNumber,
                  artists: [{name: artist}],
                  album: {name: albumName},
                  year: year,
                  length: duration
                }
                hollaback(null, data);
              }
            });
          });
        });
      });
    });
  });
};

function getTrackId(hollaback) {
  exec("database ID of current track", function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, "itunes:" + result);
    }
  });
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
      if (properties.state === "playing" && properties.intendedState === "playing" && state === "stopped") {
        setProperty("intendedState", "stopped");
        trigger("endOfTrack");
      }
      setProperty("state", state);
      if (state !== "stopped") {
        getProgress(function(error, progress) {
          if (!error && progress !== "missing value") {
            setProperty("progress", progress);
          }
        });
      }
    }
  });
};


var Itunes = function() {};

Itunes.playerName = "itunes";

Itunes.launch = function(hollaback) {
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
          Itunes.stop(hollaback);
        }
      ]);
    }
  });
};

Itunes.metadata = function(id, hollaback) {
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
          lookup(id, hollaback);
        }
      });
    }
  });
};

Itunes.play = function(track, hollaback) {
  var itunesId = track.id.split(":")[1];
  var command = "set mytrack to some track whose database ID is " + itunesId + "\n";
  command += "play mytrack with once";
  setProperty("intendedState", "playing");
  setProperty("track", track);
  exec(command, hollaback);
};

Itunes.pause = function(hollaback) {
  if (properties.state === "paused") {
    setProperty("intendedState", "playing");
    exec("play with once", hollaback);
  } else if (properties.state === "playing") {
    setProperty("intendedState", "paused");
    exec("pause", hollaback);
  } else {
    hollaback();
  }
};

Itunes.stop = function(hollaback) {
  setProperty("intendedState", "stopped");
  exec("stop", hollaback);
}

Itunes.search = function(searchString, hollaback) {
  var command = "set searchResults to {}\n";
  command += "set mytracks to search playlist \"Library\" for \"" + searchString + "\"\n";
  command += "repeat with mytrack in mytracks\n";
  command += "set searchResults to searchResults & database ID of mytrack\n";
  command += "end repeat\n";
  command += "searchResults";
  exec(command, function(error, results) {
    if (error) {
      hollaback({error: "itunes", message: "error while searching"});
    } else {
      var ids = underscore.map(results.split(","), function(id) {
        return "itunes:" + id.trim();
      });
      var runner = new AsyncRunner(hollaback);
      runner.run(ids, function(id, hollaback) {
        Itunes.metadata(id, hollaback);
      });
    }
  });
};

Itunes.add = function(unixPath, hollaback) {
  Applescript.transformPath(unixPath, function(error, asPath) {
    var command = "set mytrack to add \"" + asPath + "\"\n";
    command += "return database ID of mytrack";
    exec(command, function(error, idString) {
      if (error) {
        hollaback(error);
      } else {
        Itunes.metadata("itunes:" + idString, hollaback);
      }
    });
  });
};

Itunes.on = function(key, hollaback) {
  eventHollabacks[key].push(hollaback);
};

// Poll to trigger events
Itunes.on("state", function(properties) {
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

Itunes.on("intendedState", function(properties) {
  if (properties.intendedState === "playing") {
    if (!pollingId) {
      pollingId = setInterval(updateStatus, 250);
    }
  }
});

module.exports = Itunes;

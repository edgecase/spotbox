var path             = require("path");
var fs               = require("fs");
var underscore       = require("underscore");
var underscoreString = require("underscore.string");
var AsyncRunner      = require("async_runner");
var app              = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var EventedState     = require(path.join(app.root, "app", "lib", "evented_state"));
var settings         = require(path.join(app.root, "config", "settings"));
var Spotbox          = require(path.join(app.root, "app", "lib", "spotbox"));
var Applescript      = require(path.join(app.root, "app", "lib", "applescript"));

var state = new EventedState({
  volume: 50,
  connection: false,
  source: null
});

function exec(applescriptString, hollaback) {
  var str = "tell application \"Airfoil\"\n" + applescriptString + "\nend tell"
  Applescript.run(str, hollaback);
};

function pushVolume(hollaback) {
  command = "set myspeaker to first speaker whose name is \"" + settings.airfoil.speaker_name + "\"\n";
  command += "set (volume of myspeaker) to " + state.properties.volume / 100.0;
  exec(command, hollaback);
};

var Airfoil = function() {};

Airfoil.launch = function(hollaback) {
  exec("launch", function(error) {
    if (error) {
      hollaback(error);
    } else {
      runner = new AsyncRunner(hollaback);
      runner.run({}, [
        function(element, hollaback) {
          pushVolume(hollaback);
        },
        function(element, hollaback) {
          Airfoil.connect(hollaback);
        }
      ]);
    }
  });
};

Airfoil.connect = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.airfoil.speaker_name + "\"\n";
  command += "connect to myspeaker\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        state.set("connection", true);
        hollaback();
        pushVolume(function() {});
      } else {
        state.set("connection", false);
        hollaback({error: "airfoil", message: "connect failed"});
      }
    }
  });
};

Airfoil.disconnect = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.airfoil.speaker_name + "\"\n";
  command += "disconnect from myspeaker\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        state.set("connection", true);
        hollaback({error: "airfoil", message: "disconnect failed"});
      } else {
        state.set("connection", false);
        hollaback();
      }
    }
  });
};

Airfoil.status = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.airfoil.speaker_name + "\"\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        state.set("connection", true);
      } else {
        state.set("connection", false);
      }
      command = "volume of first speaker whose name is \"" + settings.airfoil.speaker_name + "\"";
      exec(command, function(error, result) {
        if (error) {
          hollaback(error);
        } else {
          state.set("volume", result * 100);
          hollaback(null, JSON.parse(JSON.stringify(state.properties)));
        }
      });
    }
  });
};

Airfoil.volumeUp = function() {
  var volume = state.properties.volume + 5;
  if (volume <= 100) {
    state.set("volume", volume);
    pushVolume(function() {});
  }
};

Airfoil.volumeDown = function() {
  var volume = state.properties.volume - 5;
  if (volume >= 0) {
    state.set("volume", volume);
    pushVolume(function() {});
  }
};

Airfoil.setSource = function(player, hollaback) {
  var sourceName = underscoreString.capitalize(player.playerName);
  var command = "set aSource to make new application source\n";
  command += "set application file of aSource to \"/Applications/" + sourceName + ".app\"\n";
  command += "set current audio source to aSource";
  exec(command, hollaback);
  state.set("source", sourceName);
};

Airfoil.on = function(key, hollaback) {
  state.on(key, hollaback);
};

module.exports = Airfoil

var path        = require("path");
var fs          = require("fs");
var underscore  = require("underscore");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var settings    = require(path.join(app.root, "config", "settings"));
var Spotbox     = require(path.join(app.root, "app", "lib", "spotbox"));
var Applescript = require(path.join(app.root, "app", "lib", "applescript"));

var properties = {
  volume: 20,
  connected: false
};

var eventHollabacks = {
  volume: [],
  connection: []
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

function exec(applescriptString, hollaback) {
  var str = "tell application \"Airfoil\"\n" + applescriptString + "\nend tell"
  Applescript.run(str, hollaback);
};

function pushVolume(hollaback) {
  command = "set myspeaker to first speaker whose name is \"" + settings.airfoil.speaker_name + "\"\n";
  command += "set (volume of myspeaker) to " + properties.volume / 100.0;
  exec(command, hollaback);
};

var Airfoil = function() {};

Airfoil.launch = function(hollaback) {
  exec("launch", function(error) {
    if (error) {
      hollaback(error);
    } else {
      pushVolume(hollaback);
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
        setProperty("connection", true);
        hollaback(null, underscore.extend(properties));
        pushVolume(function() {});
      } else {
        setProperty("connection", false);
        hollaback({error: "airfoil", message: "connect failed"});
      }
    }
  });
};

Airfoil.disconnect = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.airfoil.speaker_name + "\"\n";
  command = "disconnect from myspeaker\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        setProperty("connection", true);
        hollaback({error: "airfoil", message: "disconnect failed"});
      } else {
        setProperty("connection", false);
        hollaback(null, underscore.extend(properties));
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
        setProperty("connection", true);
      } else {
        setProperty("connection", false);
      }
      command = "volume of first speaker whose name is \"" + settings.airfoil.speaker_name + "\"";
      exec(command, function(error, result) {
        if (error) {
          hollaback(error);
        } else {
          setProperty("volume", result * 100);
          hollaback(null, JSON.parse(JSON.stringify(properties)));
        }
      });
    }
  });
};

Airfoil.volumeUp = function() {
  var volume = properties.volume + 5;
  if (volume <= 100) {
    setProperty("volume", volume);
    pushVolume(function() {});
  }
};

Airfoil.volumeDown = function() {
  var volume = properties.volume - 5;
  if (volume >= 0) {
    setProperty("volume", volume);
    pushVolume(function() {});
  }
};

Airfoil.on = function(key, hollaback) {
  eventHollabacks[key].push(hollaback);
};

module.exports = Airfoil

var path        = require("path");
var fs          = require("fs");
var underscore  = require("underscore");
var appConfig   = require(path.join(__dirname, "..", "..", "config", "app"));
var settings    = require(path.join(appConfig.root, "config", "settings"));
var Spotbox     = require(path.join(appConfig.root, "app", "lib", "spotbox"));
var Applescript = require(path.join(appConfig.root, "app", "lib", "applescript"));

var properties = {
  volume: 20,
  connected: false
};

var eventHollabacks = {
  volume: [],
  connected: []
};

function setProperty(key, new_value) {
  if (!underscore.isUndefined(properties[key])) {
    if (properties[key] !== new_value) {
      properties[key] = new_value;
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
  Applescript.run(str, hollaback || function(error) { if error; console.log(error); });
};

function pushVolume() {
  command = "set myspeaker to first speaker whose name is \"" + settings.speaker_name + "\"\n";
  command += "set (volume of myspeaker) to " + properties.volume / 100.0;
  exec(command);
};

var Airfoil = function() {};

Airfoil.launch = function(hollaback) {
  exec("launch", hollaback);
};

Airfoil.connect = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.speaker_name + "\"\n";
  command += "connect to myspeaker\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        setProperty("connected", true);
        hollaback(null, underscore.extend(properties));
        pushVolume();
      } else {
        setProperty("connected", false);
        hollaback({error: "airfoil", message: "connect failed"});
      }
    }
  });
};

Airfoil.disconnect = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.speaker_name + "\"\n";
  command = "disconnect from myspeaker\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        setProperty("connected", true);
        hollaback({error: "airfoil", message: "disconnect failed"});
      } else {
        setProperty("connected", false);
        hollaback(null, underscore.extend(properties));
      }
    }
  });
};

Airfoil.status = function(hollaback) {
  var command = "set myspeaker to first speaker whose name is \"" + settings.speaker_name + "\"\n";
  command += "connected of myspeaker";
  exec(command, function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      if (result === "true") {
        setProperty("connected", true);
      } else {
        setProperty("connected", false);
      }
      command = "volume of first speaker whose name is \"" + settings.speaker_name + "\"";
      exec(command, function(error, result) {
        if (error) {
          hollaback(error);
        } else {
          setProperty("volume", result * 100);
          hollaback(null, underscore.extend(properties));
        }
      });
    }
  });
};

Airfoil.volumeUp = function() {
  var volume = properties.volume + 5;
  if (volume <= 100) {
    setProperty("volume", volume);
    pushVolume();
  }
};

Airfoil.volumeDown = function() {
  var volume = properties.volume - 5;
  if (volume >= 0) {
    setProperty("volume", volume);
    pushVolume();
  }
};

Airfoil.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

module.exports = Airfoil

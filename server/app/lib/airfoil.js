var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var config     = require(path.join(__dirname, "..", "..", "config"));
var Spotbox    = require(path.join(config.root, "app", "lib", "spotbox"));

var properties = {
  volume: null,
  connection_status: null
};

var event_hollabacks = {
  volume: [],
  connection_status: []
};

function set_property(key, new_value) {
  if (!underscore.isUndefined(properties[key])) {
    if (properties[key] !== new_value) {
      properties[key] = new_value;
      trigger(key);
    }
  }
};

function trigger(key) {
  underscore.each(event_hollabacks[key], function(hollaback) {
    underscore.defer(function() {
      hollaback(underscore.clone(properties));
    });
  });
};

function send(message) {
  config.pub_socket.send(Spotbox.namespace("airfoil::" + message));
};

var Airfoil = function() {};

Airfoil.volume_up = function() {
  send("volume_up");
};

Airfoil.volume_down = function() {
  send("volume_down");
};

Airfoil.connect = function() {
  send("connect");
};

Airfoil.disconnect = function() {
  send("disconnect");
};

Airfoil.check_status = function() {
  send("status");
};

Airfoil.set_volume = function(volume) {
  set_property("volume", volume);
};

Airfoil.set_connection_status = function(connection_status) {
  set_property("connection_status", connection_status);
};

Airfoil.status = function() {
  return underscore.clone(properties);
};

Airfoil.on = function(key, hollaback) {
  event_hollabacks[key].push(hollaback);
};

module.exports = Airfoil

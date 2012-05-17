var path       = require("path");
var underscore = require("underscore");
var app        = require(path.join(__dirname, "..", "..", "config", "app"));
var Spotify    = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Itunes     = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));

var properties = {
  queue: []
};

var eventHollabacks = {
  queue: []
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

function getPlayerForId(id) {
  var player;
  if (id.match(/itunes/)) {
    player = Itunes;
  } else if (id.match(/spotify/)) {
    player = Spotify;
  }
  return player;
};


var TrackQueue = function() {};

TrackQueue.enqueue = function(id, hollaback) {
  var player = getPlayerForId(id);
  if (player) {
    player.metadata(id, function(error, track) {
      if (error) {
        hollaback(error);
      } else {
        var exists = underscore.find(properties.queue, function(t) {
          return t.id === id
        });
        if (!exists) {
          properties.queue.push(track);
          trigger("queue");
          hollaback(null, track);
        } else {
          hollaback({error: "Player enqueue", message: "duplicate"});
        }
      }
    });
  } else {
    hollaback({error: "TrackQueue", message: "bad id"});
  }
};

TrackQueue.next = function() {
  var track = properties.queue.shift();
  trigger("queue");
  return track;
};

TrackQueue.empty = function() {
  return properties.queue.length === 0;
};

TrackQueue.on = function(key, hollaback) {
  eventHollabacks[key].push(hollaback);
};

module.exports = TrackQueue;

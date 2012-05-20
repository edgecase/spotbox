var underscore = require("underscore");

var EventedState = function(properties, additionalListeningKeys) {
  additionalListeningKeys = additionalListeningKeys || {};
  this.properties = properties;
  var keys = underscore.keys(properties).concat(additionalListeningKeys);
  this.hollabacks = underscore.reduce(keys, function(memo, element) {
    memo[element] = [];
    return memo;
  }, {});
};

EventedState.prototype.set = function(key, value) {
  if (!underscore.isUndefined(this.properties[key])) {
    if (this.properties[key] !== value) {
      this.properties[key] = value;
      this.trigger(key);
    }
  } else {
    throw {error: "Events", message: "Undefined key: " + key};
  }
};

EventedState.prototype.trigger = function(key) {
  var self = this;
  if (underscore.isArray(this.hollabacks[key])) {
    underscore.each(this.hollabacks[key], function(hollaback) {
      underscore.defer(function() {
        hollaback(JSON.parse(JSON.stringify(self.properties)));
      });
    });
  } else {
    throw {error: "Events", message: "Undefined key: " + key};
  }
};

EventedState.prototype.on = function(key, hollaback) {
  if (underscore.isArray(this.hollabacks[key])) {
    this.hollabacks[key].push(hollaback);
  } else {
    throw {error: "Events", message: "Undefined key: " + key};
  }
};

module.exports = EventedState;

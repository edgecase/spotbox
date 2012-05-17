var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var app        = require(path.join(__dirname, "..", "..", "config", "app"));
var redis      = require(path.join(app.root, "config", "redis"));
var db         = require(path.join(app.root, "config", "database"));
var Spotbox    = require(path.join(app.root, "app", "lib", "spotbox"));

var POOL_KEY = "pool"

function reloadPlayPool(hollaback) {
  var key = Spotbox.namespace(POOL_KEY);
  db.collection("pool", function(error, collection) {
    if (error) {
      hollaback(error);
    } else {
      var cursor = collection.find({}, {});
      cursor.toArray(function(error, tracks) {
        if (error) {
          hollaback(error);
        } else if (tracks.length === 0){
          hollaback({error: "PlaylistManager", message: "play pool is empty"});
        } else {
          redis.rpush(key, underscore.shuffle(underscore.pluck(tracks, "id")), function(error) {
            hollaback(error);
          });
        }
      });
    }
  });
};


var PlaylistManager = function() {};

PlaylistManager.next = function(hollaback) {
  var key = Spotbox.namespace(POOL_KEY);
  redis.rpop(key, function(error, trackId) {
    if (error) {
      hollaback(error);
    } else if (trackId) {
      hollaback(null, trackId);
    } else {
      reloadPlayPool(function(error) {
        if (error) {
          hollaback(error);
        } else {
          PlaylistManager.next(hollaback);
        }
      });
    }
  });
};

module.exports = PlaylistManager;

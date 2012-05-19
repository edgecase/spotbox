var path        = require("path");
var fs          = require("fs");
var underscore  = require("underscore");
var AsyncRunner = require("async_runner");
var app         = require(path.join(__dirname, "..", "..", "config", "app"));
var redis       = require(path.join(app.root, "config", "redis"));
var db          = require(path.join(app.root, "config", "database"));
var Spotbox     = require(path.join(app.root, "app", "lib", "spotbox"));
var Spotify     = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Itunes      = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Chromaprint = require(path.join(app.root, "app", "lib", "application_interfaces", "chromaprint"));
var Eyed3       = require(path.join(app.root, "app", "lib", "application_interfaces", "eyed3"));

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

function reloadPlayPool(hollaback) {
  var key = Spotbox.namespace("pool");
  db.collection("tracks", function(error, collection) {
    if (error) {
      hollaback(error);
    } else {
      var cursor = collection.find({pool: true}, {});
      cursor.toArray(function(error, tracks) {
        if (error) {
          hollaback(error);
        } else if (tracks.length === 0){
          hollaback({error: "TrackManager", message: "track pool is empty"});
        } else {
          redis.rpush(key, underscore.shuffle(underscore.pluck(tracks, "id")), function(error) {
            hollaback(error);
          });
        }
      });
    }
  });
};

function loadNextFromPool(hollaback) {
  var key = Spotbox.namespace("pool");
  redis.rpop(key, function(error, trackId) {
    if (error) {
      hollaback(error);
    } else if (trackId) {
      getPlayerForId(trackId).metadata(hollaback);
    } else {
      reloadPlayPool(function(error) {
        if (error) {
          hollaback(error);
        } else {
          loadNextFromPool(hollaback);
        }
      });
    }
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


var TrackManager = function() {};

TrackManager.next = function(hollaback) {
  if (properties.queue.length > 0) {
    var track = properties.queue.shift();
    trigger("queue");
    hollaback(null, track);
  } else {
    loadNextFromPool(hollaback);
  }
};

TrackManager.enqueue = function(id, hollaback) {
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

TrackManager.queue = function() {
  return JSON.parse(JSON.stringify(properties.queue));
};

TrackManager.import = function(filepath, hollaback) {
  Chromaprint.identify(filepath, function(error, fingerprintData) {
    if (error) {
      hollaback(error);
    } else {
      AcoustidApi.lookup(fingerprintData, function(error, musicBrainzId) {
        if (error) {
          hollaback(error)
        } else if (!musicBrainzId) {
          // skip remaining steps and add directly to itunes
          Itunes.add(filepath, function(error, itunesData) {
            TrackManager.add(itunesData, hollaback);
          });
        } else {
          MusicBrainz.lookup(musicBrainzId, function(error, metadata) {
            if (error) {
              hollaback(error);
            } else {
              Eyed3.clearTags(filepath, function(error) {
                if (error) {
                  hollaback(error);
                } else {
                  Eyed3.writeTags(filepath, metadata, function(error) {
                    Itunes.add(filepath, function(error, itunesData) {
                      if (error) {
                        hollaback(error);
                      } else {
                        metadata.id = itunesData.id;
                        TrackManager.add(metadata, hollaback);
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

TrackManager.addToPool = function(track, hollaback) {
  db.collection("tracks", function(error, collection) {
    collection.update({id: track.id}, {$set: {id: track.id, pool: true}}, {upsert: true});
  });
};

TrackManager.removeFromPool = function(track, hollaback) {
  db.collection("tracks", function(error, collection) {
    collection.update({id: track.id}, {$set: {id: track.id, pool: false}}, {upsert: true});
  });
};

TrackManager.markPlayed = function(track, data, hollaback) {
  var runner = new AsyncRunner(hollaback);
  runner.run(track, [
    function(track, hollaback) {
      db.collection("played", function(error, collection) {
        collection.insert(underscore.extend({}, track, data), {});
        hollaback(error);
      });
    },
    function(track, hollaback) {
      TrackManager.addToPool(track, hollaback)
    }
  ]);
};

TrackManager.markSkipped = function(track, data, hollaback) {
  var runner = new AsyncRunner(hollaback);
  runner.run(track, [
    function(track, hollaback) {
      db.collection("skipped", function(error, collection) {
        collection.insert(underscore.extend({}, track, data), {});
        hollaback(error);
      });
    },
    function(track, hollaback) {
      TrackManager.removeFromPool(track, hollaback);
    }
  ]);
};

TrackManager.on = function(key, hollaback) {
  eventHollabacks[key].push(hollaback);
};

module.exports = TrackManager;

var path         = require("path");
var fs           = require("fs");
var underscore   = require("underscore");
var AsyncRunner  = require("async_runner");
var app          = require(path.join(__dirname, "..", "..", "config", "app"));
var redis        = require(path.join(app.root, "config", "redis"));
var db           = require(path.join(app.root, "config", "database"));
var EventedState = require(path.join(app.root, "app", "lib", "evented_state"));
var Spotbox      = require(path.join(app.root, "app", "lib", "spotbox"));
var Spotify      = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Itunes       = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Chromaprint  = require(path.join(app.root, "app", "lib", "application_interfaces", "chromaprint"));
var AcoustidApi  = require(path.join(app.root, "app", "lib", "apis", "acoustid_api"));

var state = new EventedState({
  queue: []
});

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
      getPlayerForId(trackId).metadata(trackId, hollaback);
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
  var track = state.properties.queue.shift();
  if (track) {
    hollaback(null, track);
    state.trigger("queue");
  } else {
    loadNextFromPool(hollaback);
  }
};

TrackManager.enqueue = function(id, user, hollaback) {
  var player = getPlayerForId(id);
  if (player) {
    player.metadata(id, function(error, track) {
      if (error) {
        hollaback(error);
      } else {
        var exists = underscore.find(state.properties.queue, function(t) {
          return t.id === id
        });
        if (!exists) {
          track.user = user;
          state.properties.queue.push(track);
          state.trigger("queue");
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
  return JSON.parse(JSON.stringify(state.properties.queue));
};

TrackManager.retag = function(id, acoustidId, acoustidTrackId, acoustidAlbumId, hollaback) {
  AcoustidApi.lookup(acoustidId, acoustidTrackId, acoustidAlbumId, function(error, track) {
    if (error) {
      hollaback(error);
    } else {
      var runner = new AsyncRunner(hollaback);
      runner.run({}, [
        function(element, hollaback) {
          Itunes.retag(id, track, hollaback);
        },
        function(element, hollaback) {
          db.collection("tracks", function(error, collection) {
            var acoustid = {
              id: acoustidId,
              trackId: acoustidTrackId,
              albumId: acoustidAlbumId
            };
            collection.update({id: track.id}, {$set: {acoustid: acoustid}}, {upsert: true, safe: true}, hollaback);
          });
        }
      ]);
    }
  });
};

TrackManager.import = function(filepath, user, hollaback) {
  function addTrack(track, extras, hollaback) {
    underscore.extend(extras, {user: user, createdAt: new Date()});
    db.collection("tracks", function(error, collection) {
      collection.update({id: track.id}, {$set: extras}, {upsert: true, safe: true}, function() {
        hollaback();
      });
    });
  };

  var mp3filepath = filepath + ".mp3";
  fs.rename(filepath, mp3filepath, function(error) {
    if (error) {
      hollaback(error);
    } else {
      var runner = new AsyncRunner(function(errors, results) {
        if (errors) {
          hollaback(errors);
        } else {
          var itunesMeta = results[0];
          var fingerprint = results[1].fingerprint;
          var acoustidId = results[1].acoustidId;
          if (!acoustidId) {
            addTrack(itunesMeta, {fingerprint: fingerprint}, hollaback);
          } else {
            AcoustidApi.bestMatchLookup(acoustidId, itunesMeta, function(error, track) {
              if (error) {
                hollaback(error);
              } else if (!track) {
                var attrs = {
                  acoustid: {id: acoustidId},
                  fingerprint: fingerprint
                };
                addTrack(itunesMeta, attrs, hollaback);
              } else {
                track.id = itunesMeta.id;
                var runner = new AsyncRunner(hollaback);
                runner.run({}, [
                  function(element, hollaback) {
                    Itunes.retag(track, hollaback);
                  },
                  function(element, hollaback) {
                    var attrs = {
                      provider: "local",
                      fingerprint: fingerprint,
                      acoustid: {id: acoustidId, trackId: track.ids.music_brainz, albumId: track.album.id}
                    };
                    addTrack(track, attrs, hollaback);
                  }
                ]);
              }
            });
          }
        }
      });
      runner.run({}, [
        function(element, hollaback) {
          Itunes.import(mp3filepath, hollaback);
        },
        function(element, hollaback) {
          Chromaprint.identify(mp3filepath, function(error, data) {
            if (error) {
              hollaback(error);
            } else if (!data) {
              hollaback(null, {fingerprint: data.fingerprint});
            } else {
              AcoustidApi.fingerprintLookup(data, function(error, acoustidId) {
                hollaback(error, {acoustidId: acoustidId, fingerprint: data.fingerprint});
              });
            }
          });
        },
      ]);
    }
  });
};

TrackManager.addToPool = function(track, options, hollaback) {
  underscore.extend(options, {id: track.id, pool: true});
  db.collection("tracks", function(error, collection) {
    collection.update({id: track.id}, {$set: options}, {upsert: true});
  });
};

TrackManager.removeFromPool = function(track, hollaback) {
  db.collection("tracks", function(error, collection) {
    collection.update({id: track.id}, {$set: {id: track.id, pool: false}}, {upsert: true});
  });
};

TrackManager.markPlayed = function(track, data, hollaback) {
  // TODO: Set created_at date
  var runner = new AsyncRunner(hollaback);
  runner.run(track, [
    function(track, hollaback) {
      db.collection("played", function(error, collection) {
        collection.insert(underscore.extend({}, track, data), {});
        hollaback(error);
      });
    },
    function(track, hollaback) {
      TrackManager.addToPool(track, {}, hollaback)
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

TrackManager.userUploads = function(data, hollaback) {
  db.collection("tracks", function(error, collection) {
    var cursor = collection.find({"$and": [{"user.email": data.email},{provider: "local"}]});
    cursor.toArray(function(error, tracks) {
      if (error) {
        hollaback(error);
      } else {
        var possibleTracks = underscore.chain(tracks).reduce(function(memo, track) {
          memo.push(AcoustidApi.groupLookup(track));
        }, []).compact().value();
        hollaback(null, possibleTracks);
      }
    });
  });
};

TrackManager.on = function(key, hollaback) {
  state.on(key, hollaback);
};

module.exports = TrackManager;

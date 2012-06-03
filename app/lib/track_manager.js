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

function findByFingerprint(fingerprint, hollaback) {
  db.collection("tracks", function(error, collection) {
    if (error) return hollaback(error);
    collection.find({fingerprint: fingerprint}, {limit: 1}).toArray(function(error, tracks) {
      if (error) return hollaback(error);
      hollaback(null, tracks[0]);
    });
  });
};

function findByAcoustidId(acoustidId, hollaback) {
  db.collection("tracks", function(error, collection) {
    if (error) return hollaback(error);
    collection.find({acoustid: {id: acoustidId}}, {limit: 1}).toArray(function(error, tracks) {
      if (error) return hollaback(error);
      hollaback(null, tracks[0]);
    });
  });
};

function findByFingerprintOrAcoustidId(fingerprint, acoustidId, hollaback) {
  var runner = new AsyncRunner(function(errors, results) {
    if (errors) return hollaback(errors);
    hollaback(null, underscore.compact(results)[0]);
  });
  runner.run({}, [
    function(element, hollaback) {
      findByFingerprint(fingerprint, hollaback);
    },
    function(element, hollaback) {
      findByAcoustidId(acoustidId, hollaback);
    }
  ]);
};

function addTrack(track, attrs, hollaback) {
  underscore.extend(attrs, {createdAt: new Date(), id: track.id});
  db.collection("tracks", function(error, collection) {
    collection.insert(attrs, {safe: true}, hollaback);
  });
};

function importWithoutAcoustid(filepath, fingerprint, user, hollaback) {
  findByFingerprint(findByFingerprint, function(error, result) {
    if (error) return hollaback(error);
    if (result) return hollaback({error: "track manager import", message: "duplicate track"});
    Itunes.import(filepath, function(error, itunesMeta) {
      if (error) return hollaback(error);
      addTrack(itunesMeta, {fingerprint: fingerprint, user: user, upload: true}, hollaback);
    });
  });
};

function importWithAcoustid(filepath, fingerprint, acoustidId, user, hollaback) {
  findByFingerprintOrAcoustidId(fingerprint, acoustidId, function(error, result) {
    if (error) return hollaback(error);
    if (result) return hollaback({error: "track manager import", message: "duplicate track"});
    Itunes.import(filepath, function(error, itunesMeta) {
      if (error) return hollaback(error);
      AcoustidApi.bestMatchLookup(acoustidId, itunesMeta, function(error, track) {
        if (error) return hollaback(error);
        if (!track) {
          var attrs = { acoustid: {id: acoustidId}, fingerprint: fingerprint, user: user, upload: true };
          addTrack(itunesMeta, attrs, hollaback);
        } else {
          track.id = itunesMeta.id;
          var attrs = {
            fingerprint: fingerprint,
            acoustid: {id: acoustidId, trackId: track.ids.music_brainz, albumId: track.album.id},
            user: user,
            upload: true
          };
          new AsyncRunner(hollaback).run({}, [
            function(element, hollaback) { Itunes.retag(track, hollaback) },
            function(element, hollaback) { addTrack(track, attrs, hollaback) }
          ]);
        }
      });
    });
  });
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
          track.meta = {user: user};
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
    if (error) return hollaback(error);
    if (!track) return hollaback({error: "retag", message: "combination does not exist"});
    db.collection("tracks", function(error, collection) {
      var acoustid = {
        id: acoustidId,
        trackId: acoustidTrackId,
        albumId: acoustidAlbumId
      };
      collection.update({id: track.id}, {$set: {acoustid: acoustid}}, {safe: true}, hollaback);
    });
  });
};

TrackManager.import = function(filepath, filename, user, hollaback) {
  var audioFilePath = filepath + "." + underscore.last(filename.split("."));
  fs.rename(filepath, audioFilePath, function(error) {
    if (error) return hollaback(error);
    Chromaprint.identify(audioFilePath, function(error, data) {
      if (error) return hollaback(error);
      var fingerprint = data.fingerprint;
      AcoustidApi.fingerprintLookup(data, function(error, acoustidId) {
        if (error) return hollaback(error);
        if (!acoustidId) {
          importWithoutAcoustid(audioFilePath, fingerprint, user, hollaback);
        } else {
          importWithAcoustid(audioFilePath, fingerprint, acoustidId, user, hollaback);
        }
      });
    });
  })
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
  // TODO: Set created_at date
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
    collection.find({"user.email": data.email, upload: true}).toArray(function(error, tracks) {
      if (error) return hollaback(error);
      new AsyncRunner(hollaback).run(tracks, function(track, hollaback) {
        TrackManager.metadata(track.id, hollaback);
      });
    });
  });
};

TrackManager.metadata = function(id, hollaback) {
  var player = getPlayerForId(id);
  if (!player) return hollaback({error: "not found", message: "track not found"});
  player.metadata(id, hollaback);
};

TrackManager.on = function(key, hollaback) {
  state.on(key, hollaback);
};

module.exports = TrackManager;

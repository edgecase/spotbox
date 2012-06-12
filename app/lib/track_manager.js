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
var Users        = require(path.join(app.root, "app", "lib", "users"));

var state = new EventedState({
  queue: []
});

function trackScore(id, hollaback) {
  db.collection("tracks", function(error, collection) {
    collection.find({id: id}).toArray(function(error, results) {
      if (error) return hollaback(error);
      if (results.length === 0) return hollaback({error: "track score", message: "track " + id + " does not exist"});
      var track = results[0];
      if (!track.votes) return hollaback(null, 0);
      var users = Users.list();
      var score = underscore.reduce(users, function(memo, user) {
        var vote = track.votes[Users.safeEmail(user)];
        if (vote === "up") {
          memo = memo + 1;
        } else if (vote === "down") {
          memo = memo - 1;
        } else {
          // No vote
          memo = memo + 0.5;
        }
        return memo;
      }, 0);
      hollaback(null, score);
    });
  });
};

function reloadPool(hollaback) {
  var key = Spotbox.namespace("pool");
  db.collection("tracks", function(error, collection) {
    if (error) return hollaback(error);
    collection.find().toArray(function(error, tracks) {
      if (error) return hollaback(error);
      if (tracks.length === 0) return hollaback({error: "reload pool", message: "no tracks available"});
      redis.rpush(key, underscore.shuffle(underscore.pluck(tracks, "id")), hollaback);
    });
  });
};

function findNextTrack(hollaback) {
  redis.rpop(Spotbox.namespace("pool"), function(error, trackId) {
    if (error) return hollaback(error);
    if (!trackId) {
      reloadPool(function(error) {
        if (error) return hollaback(error);
        findNextTrack(hollaback);
      });
    }
    trackScore(trackId, function(error, score) {
      if (error) return hollaback(error);
      if (score >= 0) {
        TrackManager.metadata(trackId, hollaback);
      } else {
        findNextTrack(hollaback);
      }
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

function addTrack(track, user, additionalAttrs, hollaback) {
  var attrs = underscore.extend({}, additionalAttrs, {createdAt: new Date(), id: track.id, user: user});
  db.collection("tracks", function(error, collection) {
    collection.update({id: attrs.id}, {$set: attrs}, {safe: true, upsert: true}, hollaback);
  });
};

function findByFingerprint(fingerprint, hollaback) {
  db.collection("tracks", function(error, collection) {
    if (error) return hollaback(error);
    collection.find({fingerprint: fingerprint}).limit(1).toArray(function(error, tracks) {
      if (error) return hollaback(error);
      hollaback(null, tracks[0]);
    });
  });
};

function findByAcoustidId(acoustidId, hollaback) {
  db.collection("tracks", function(error, collection) {
    if (error) return hollaback(error);
    collection.find({acoustid: {id: acoustidId}}).limit(1).toArray(function(error, tracks) {
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

function importWithoutAcoustid(filepath, fingerprint, user, hollaback) {
  findByFingerprint(findByFingerprint, function(error, result) {
    if (error) return hollaback(error);
    if (result) return hollaback({error: "import", message: "duplicate track"});
    Itunes.import(filepath, function(error, itunesMeta) {
      if (error) return hollaback(error);
      addTrack(itunesMeta, user, {fingerprint: fingerprint, upload: true}, hollaback);
    });
  });
};

function importWithAcoustid(filepath, fingerprint, acoustidId, user, hollaback) {
  findByFingerprintOrAcoustidId(fingerprint, acoustidId, function(error, result) {
    if (error) return hollaback(error);
    if (result) return hollaback({error: "import", message: "duplicate track"});
    Itunes.import(filepath, function(error, itunesMeta) {
      if (error) return hollaback(error);
      AcoustidApi.bestMatchLookup(acoustidId, itunesMeta, function(error, track) {
        if (error) return hollaback(error);
        if (!track) {
          var attrs = { acoustid: {id: acoustidId}, fingerprint: fingerprint, upload: true };
          addTrack(itunesMeta, user, attrs, hollaback);
        } else {
          track.id = itunesMeta.id;
          var attrs = {
            fingerprint: fingerprint,
            acoustid: {id: acoustidId, trackId: track.ids.music_brainz, albumId: track.album.id},
            upload: true
          };
          new AsyncRunner(hollaback).run({}, [
            function(element, hollaback) { Itunes.retag(track, hollaback) },
            function(element, hollaback) { addTrack(track, user, attrs, hollaback) }
          ]);
        }
      });
    });
  });
};


var TrackManager = function() {};

// Determine next track to play
TrackManager.next = function(hollaback) {
  var track = state.properties.queue.shift();
  if (track) {
    hollaback(null, underscore.extend(track, {queue: true}));
    state.trigger("queue");
  } else {
    findNextTrack(hollaback);
  }
};

// Add a track to the queue
TrackManager.enqueue = function(id, user, hollaback) {
  var exists = underscore.find(state.properties.queue, function(t) { return t.id === id });
  if (exists) return hollaback({error: "enqueue", message: "duplicate"});
  TrackManager.metadata(id, function(error, track) {
    if (error) return hollaback(error);
    addTrack(track, user, {}, function(error) {
      TrackManager.vote(id, user, "up", function(error) {
        TrackManager.metadata(id, function(error, track) {
          if (error) return hollaback(error);
          state.properties.queue.push(track);
          state.trigger("queue");
          hollaback(error, track);
        });
      });
    });
  });
};

// List of songs in the queue
TrackManager.queue = function() {
  return JSON.parse(JSON.stringify(state.properties.queue));
};

// Change a tracks musicbrainz id
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

// Import an audio file, fingerprint and attempt to retrieve metadata from musicbrainz.
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

// Refresh track with latest info (votes, etc) and save in "played" collection
TrackManager.markPlayed = function(track, hollaback) {
  db.collection("played", function(error, playedCollection) {
    db.collection("tracks", function(error, tracksCollection) {
      if (error) return hollaback(error);
      tracksCollection.find({id: track.id}).toArray(function(error, results) {
        if (error) return hollaback(error);
        if (results.length === 0) return hollaback({error: "mark played", message: "track " + track.id + " not found"});
        track = results[0];
        playedCollection.insert(track, {safe: true}, hollaback);
      });
    });
  });
};

// List tracks that a user has uploaded
TrackManager.userUploads = function(user, hollaback) {
  db.collection("tracks", function(error, collection) {
    collection.find({"user.email": user.email, upload: true}).toArray(function(error, tracks) {
      if (error) return hollaback(error);
      new AsyncRunner(hollaback).run(tracks, function(track, hollaback) {
        TrackManager.metadata(track.id, hollaback);
      });
    });
  });
};

// Retrieve metadata on a track without having to know where it came from
TrackManager.metadata = function(id, hollaback) {
  var player = getPlayerForId(id);
  if (!player) return hollaback({error: "metadata", message: "track " + id + " not found"});
  player.metadata(id, hollaback);
};

// Vote up or down on a track
TrackManager.vote = function(id, user, rating, hollaback) {
  if (!(rating === "up" || rating === "down")) return hollaback({error: "vote", message: "rating " + rating + " must be up or down"});
  db.collection("tracks", function(error, collection) {
    if (error) return hollaback(error);
    var voteKey = "votes." + Users.safeEmail(user);
    var vote = {};
    vote[voteKey] = rating;
    collection.update({id: id}, {$set: vote}, {safe: true}, hollaback);
  });
};

TrackManager.score = function(id, hollaback) {
  trackScore(id, hollaback);
};

TrackManager.on = function(key, hollaback) {
  state.on(key, hollaback);
};

module.exports = TrackManager;

var path        = require("path");
var querystring = require("querystring");
var crypto      = require("crypto");
var underscore  = require("underscore");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var settings    = require(path.join(app.root, "config", "settings"));
var redis       = require(path.join(app.root, "config", "redis"));
var RateLimiter = require(path.join(app.root, "app", "lib", "rate_limiter"));
var HttpJson    = require(path.join(app.root, "app", "lib", "http_json"));
var Spotbox     = require(path.join(app.root, "app", "lib", "spotbox"));

var rateLimiter = new RateLimiter(1000.0 / 3); // 3 requests per second

var apiSettings = {
  host: "api.acoustid.org",
  version: "v2"
};

function request(method, data, hollaback) {
  var options = {
    host: apiSettings.host,
    path: "/" + apiSettings.version + "/lookup"
  };

  var query = querystring.stringify(data) + "&meta=recordings+releasegroups+releases";
  rateLimiter.queue(function() {
    if (method === "POST") {
      options.headers = {"Content-Type": "application/x-www-form-urlencoded"};
      HttpJson.post(options, query, hollaback);
    } else {
      options.path += "?" + query;
      HttpJson.get(options, hollaback);
    }
  });
};

function cachedRequest(method, params, cacheKey, hollaback) {
  redis.get(cacheKey, function(error, resultString) {
    if (error) {
      hollaback(error);
    } else if (resultString) {
      hollaback(null, JSON.parse(resultString));
    } else {
      request(method, params, function(error, json) {
        if (error) {
          hollaback(error);
        } else {
          hollaback(null, json);
          redis.set(cacheKey, JSON.stringify(json));
        }
      });
    }
  });
};

function buildRecordingTracks(recording) {
  var artists = recording.artists;
  return underscore.map(recording.releasegroups, function(group) {
    return {
      provider: "acoustid",
      ids: {
        music_brainz: recording.id
      },
      name: recording.title,
      track_number: group.releases[0].track_count,
      length: recording.duration,
      artists: artists,
      album: {
        name: group.title,
        id: group.id,
        released: group.releases[0].date.year
      }
    };
  });
};

function findBestResult(results) {
  return underscore.sortBy(results, function(recording) {
    return -recording.score;
  })[0];
};


var Acoustid = function() {};

Acoustid.fingerprintLookup = function(data, hollaback) {
  var sha = crypto.createHash("sha1");
  sha.update(data.fingerprint);
  sha.update(data.duration);

  var key = Spotbox.namespace("acoustid:fingerprint:" + sha.digest("hex"));

  var params = {
    client: settings.acoustid.api_key,
    duration: data.duration,
    format: "json",
    fingerprint: data.fingerprint
  };

  cachedRequest("POST", params, key, function(error, data) {
    if (error) {
      hollaback(error);
    } else {
      var result = findBestResult(data.results);
      if (result) {
        hollaback(null, result.id);
      } else {
        hollaback();
      }
    }
  });
};

Acoustid.groupLookup = function(acoustid, hollaback) {
  var params = {
    client: settings.acoustid.api_key,
    format: "json",
    trackid: acoustid
  };

  var key = Spotbox.namespace("acoustid:id:" + acoustid);

  cachedRequest("GET", params, key, function(error, data) {
    if (error) {
      hollaback(error);
    } else {
      var result = findBestResult(data.results);

      var recordingTracks = underscore.reduce(result.recordings, function(memo, recording) {
        try {
          memo = memo.concat(buildRecordingTracks(recording));
        } catch(e) {
          console.log("error building recording track: ", e);
        }
        return memo;
      }, []);

      hollaback(null, recordingTracks);
    }
  });
};

Acoustid.bestMatchLookup = function(acoustidId, sourceTrack, hollaback) {
  Acoustid.groupLookup(acoustidId, function(error, tracks) {
    var filteredTracks = underscore.filter(tracks, function(track) {
      return track.artists && track.artists.length && track.length && track.name;
    });
    if (sourceTrack.name) {
      var orderedTracks = underscore.sortBy(filteredTracks, function(track) {
        var parts = sourceTrack.name.split(/\s/);
        return -underscore.reduce(parts, function(memo, part) {
          if (part.length >= 3) {
            if (track.name.match(part)) {
              memo += part.length;
            };
          }
          return memo;
        }, 0);
      });
      hollaback(null, orderedTracks[0]);
    } else {
      hollaback(null, filteredTracks[0]);
    }
  });
};

Acoustid.lookup = function(acoustidId, trackId, albumId, hollaback) {
  var key = Spotbox.namespace("acoustid:track:" + acoustidId + trackId + albumId);

  redis.get(key, function(error, cachedMetadata) {
    if (error) {
      hollaback(error);
    } else if (cachedMetadata) {
      hollaback(null, JSON.parse(cachedMetadata));
    } else {
      Acoustid.groupLookup(acoustidId, function(error, tracks) {
        if (error) {
          hollaback(error);
        } else {
          var track = underscore.find(tracks, function(track) {
            return track.ids.music_brainz === trackId && track.album.id === albumId;
          });
          if (track) {
            redis.set(key, JSON.stringify(track), function(error) {
              hollaback(error, track);
            });
          } else {
            hollaback({error: "Acoustid", message: "Track not found"});
          }
        }
      });
    }
  });
};

module.exports = Acoustid;

var path        = require("path");
var querystring = require("querystring");
var crypto      = require("crypto");
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

  rateLimiter.queue(function() {
    if (method === "POST") {
      var request = HttpJson.post(options, hollaback);
      request.write(querystring.stringify(data));
      request.end();
    } else {
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
    var track = {
      provider: "acoustid",
      ids: {
        music_brainz: recording.id
      },
      name: recording.title,
      track_number: group.releases[0].track_count,
      length: recording.duration,
      album: {
        name: group.title,
        id: group.id,
        released: group.releases[0].date.year
      }
    };
  });
};

function bestResult(data) {
  var result = underscore.sortBy(data.results, function(result) {
    return -result.score;
  })[0];

  return result;
};

var Acoustid = function() {};

Acoustid.fingerprintLookup = function(data, hollaback) {
  var sha = crypto.createHash("sha1");
  sha.update(data.fingerprint);
  sha.update(data.duration);

  var key = Spotbox.namespace("acoustid:fingerprint" + sha.digest("hex"));

  var params = {
    client: settings.acoustid.api_key,
    meta: "recordings+releasegroups+releases",
    duration: data.duration,
    format: "json",
    fingerprint: data.fingerprint
  };

  cachedRequest("POST", params, key, function(error, data) {
    if (error) {
      hollback(error);
    } else {
      if (data.results.length === 0) {
        hollaback();
      } else {
        var result = bestResult(data);
        var acoustidData = {
          acoustid: result.id,
          trackId: result.recordings[0].id,
          albumId: result.recordings[0].releasegroups[0].id
        };

        hollaback(null, acoustidData);
      }
    }
  });
};

Acoustid.groupLookup = function(acoustid, hollaback) {
  var params = {
    client: settings.acoustid.api_key,
    meta: "recordings+releasegroups+releases",
    format: "json",
    trackid: acoustid
  };

  var key = Spotbox.namespace("acoustid:id:" + acoustid);

  cachedRequest("GET", params, key, function(error, data) {
    if (error) {
      hollaback(error);
    } else {
      var result = bestResult(data);
      var recordingTracks = underscore.chain(result.recordings).map(result.recordings, function(recording) {
        return buildRecordingTracks(recording);
      }).flatten().value();

      hollaback(null, recordingTracks);
    }
  });
};

Acoustid.lookup = function(acoustid, trackId, albumId, hollaback) {
  var key = Spotbox.namespace("acoustid:track:" + acoustid + trackId + albumId);

  redis.get(key, function(error, cachedMetadata) {
    if (error) {
      hollaback(error);
    } else if (cachedMetadata) {
      hollback(null, JSON.parse(cachedMetadata));
    } else {
      Acoustid.groupLookup(acoustid, function(error, tracks) {
        if (error) {
          hollaback(error);
        } else {
          var track = underscore.find(tracks, function(track) {
            return track.ids.music_brainz === trackId && track.album.id === albumId;
          });
          redis.set(key, JSON.stringify(track), function(error) {
            hollaback(error, track);
          });
        }
      });
    }
  });
};

module.exports = Acoustid;

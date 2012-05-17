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

function request(data, hollaback) {
  var options = { method: "POST" };
  options.host = apiSettings.host;
  options.path = "/" +  apiSettings.version + "/lookup"

  rateLimiter.queue(function() {
    var request = HttpJson.request(options, hollaback);
    request.write(querystring.stringify(data));
    request.end();
  });
};

function cachedRequest(data, cacheKey, hollaback) {
  redis.get(cacheKey, function(error, resultString) {
    if (error) {
      hollaback(error);
    } else if (resultString) {
      hollaback(null, JSON.parse(resultString));
    } else {
      request(data, function(error, json) {
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

var Acoustid = function() {};

Acoustid.lookup = function(data, hollaback) {
  var sha = crypto.createHash("sha1");
  sha.update(data.fingerprint);
  sha.update(data.duration);

  var key = Spotbox.namespace("acoustid:" + sha.digest("hex"));

  var data = {
    client: settings.acoustid.api_key,
    meta: "recordingids",
    duration: data.duration,
    format: "json",
    fingerprint: data.fingerprint
  };
  cachedRequest(data, key, hollaback);
};

module.exports = Acoustid;

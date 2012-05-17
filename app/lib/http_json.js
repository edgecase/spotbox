var http       = require("http");
var underscore = require("underscore");
var path       = require("path");
var app        = require(path.join(__dirname, "..", "..", "config", "app"));
var Spotbox    = require(path.join(app.root, "app", "lib", "spotbox"));

var HttpJson = function () {};
HttpJson.request = function(options, hollaback) {
  underscore.defaults(options, {headers: {}});
  underscore.extend(options.headers, {"User-Agent": Spotbox.userAgent});

  http.request(options, function(response) {
    var metadata = "";
    response.on("data", function(chunk) {
      metadata += chunk.toString();
    });
    response.on("end", function() {
      hollaback(null, JSON.parse(metadata));
    });
    response.on("error", function(error) {
      hollaback(error);
    });
  }).end();
};

module.exports = HttpJson;

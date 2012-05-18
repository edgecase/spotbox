var http       = require("http");
var underscore = require("underscore");
var path       = require("path");
var app        = require(path.join(__dirname, "..", "..", "config", "app"));
var Spotbox    = require(path.join(app.root, "app", "lib", "spotbox"));

function request(options, hollaback) {
  underscore.defaults(options, {headers: {}});
  underscore.extend(options.headers, {"User-Agent": Spotbox.userAgent});

  var request = http.request(options, function(response) {
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
  });

  return request;
};

var HttpJson = function () {};
HttpJson.get = function(options, hollaback) {
  options.method = "GET";
  request(options, hollaback).end();
};

HttpJson.post = function(options, hollaback) {
  options.method = "POST";
  return request(options, hollaback);
};

module.exports = HttpJson;

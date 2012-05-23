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
      try {
        hollaback(null, JSON.parse(metadata));
      } catch (e) {
        hollaback({error: "HttpJson", message: metadata});
      }
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

HttpJson.post = function(options, body, hollaback) {
  options.method = "POST";
  underscore.defaults(options, {headers: {}});
  options.headers["Content-Length"] = body.length;
  var req = request(options, hollaback)
  req.write(body);
  req.end();
};

module.exports = HttpJson;

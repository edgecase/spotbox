var path    = require("path");
var fs      = require("fs");
var app     = require(path.join(__dirname, "..", "..", "config", "app"));
var package = require(path.join(app.root, "package.json"));

var Spotbox = function() {};

Spotbox.namespace = function(str) {
  return "spotbox:" + str;
};

Spotbox.version = package.version;

Spotbox.userAgent = "spotbox/" + Spotbox.version + " ( https://github.com/edgecase/spotbox )";

module.exports = Spotbox;

var path        = require("path");
var fs          = require("fs");
var underscore  = require("underscore");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var settings    = require(path.join(app.root, "config", "settings"));
var Runner      = require(path.join(app.root, "app", "lib", "runner"));


var Eyed3 = function() {};

Eyed3.clearTags = function(filepath, hollaback) {
  Runner.exec(settings.eyed3.path, ["--remove-all", filepath], hollaback);
};

Eyed3.writeTags = function(filepath, data, hollaback) {
  var artists = underscore.pluck(data.artists, "name").join(",");
  var options = [
    "--itunes",
    "--artist=" + artists,
    "--album=" + data.album.name,
    "--title=" + data.name,
    "--track=" + data.track_number,
    "--year=" + data.album.released,
    filepath
  ];
  Runner.exec(settings.eyed3.path, options, hollaback)
};

module.exports = Eyed3;

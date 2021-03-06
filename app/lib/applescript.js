var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var app        = require(path.join(__dirname, "..", "..", "config", "app"));
var Runner     = require(path.join(app.root, "app", "lib", "runner"));
var logger     = require('nlogger').logger(module);

var Applescript = function() {};

Applescript.run = function(applescriptString, hollaback) {
  var child = Runner.exec("osascript", ["-"], function(error, result) {
    if (error) {
      logger.error(error);
    } else {
      result = result.trim();
    }
    hollaback(error, result);
  });
  child.stdin.write(applescriptString);
  child.stdin.end();
}

Applescript.transformPath = function(unixPath, hollaback) {
  Applescript.run("POSIX file \"" + unixPath + "\" as text", hollaback);
};

module.exports = Applescript;

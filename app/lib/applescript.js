var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var app        = require(path.join(__dirname, "..", "..", "config", "app"));
var Runner     = require(path.join(app.root, "app", "lib", "runner"));

var Applescript = function() {};

Applescript.run = function(applescriptString, hollaback) {
  var child = Runner.exec("osascript", ["-"], function(error, result) {
    if (error) {
      console.error("applescript error executing:", applescriptString);
      console.error(error);
    } else {
      result = result.trim();
    }
    hollaback(error, result);
  });
  child.stdin.write(applescriptString);
  child.stdin.end();
}

// Note: Takes a path relative to the application
Applescript.transformPath = function(unixPath, hollaback) {
  Applescript.run("POSIX file \"" + unixPath + "\" as text", hollaback);
};

module.exports = Applescript;

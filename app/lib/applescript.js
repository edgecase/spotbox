var path          = require("path");
var fs            = require("fs");
var underscore    = require("underscore");
var child_process = require("child_process");
var appConfig     = require(path.join(__dirname, "..", "..", "config", "app"));

function shell_out(command, args, hollaback) {
  var child = child_process.spawn(command, args);
  var result = "";
  var error = ""
  child.stdout.on("data", function(chunk) {
    result += chunk.toString();
  });
  child.stderr.on("data", function(chunk) {
    error += chunk.toString();
  });
  child.on("exit", function(code) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, result);
    }
  });
  return child;
};

var Applescript = function() {};

Applescript.run = function(applescriptString, hollaback) {
  var child = shell_out("osascript", ["-"], function(error, result) {
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

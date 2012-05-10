var path          = require("path");
var fs            = require("fs");
var underscore    = require("underscore");
var child_process = require("child_process");
var config        = require(path.join(__dirname, "..", "..", "config"));

var rootPath = null;

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

// Determine applescript root path
shell_out("osascript", [path.join(config.root, "applescripts", "root_path.scpt")], function(error, result) {
  var scriptPath = result.slice(6).replace("\n", "");
  rootPath = scriptPath.split(":").slice(0, -2).join(":");
});

var Applescript = function() {};

Applescript.run = function(applescriptString, hollaback) {
  var child = shell_out("osascript", ["-"], function(error, result) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, result.trim());
    }
  });
  child.stdin.write(applescriptString);
  child.stdin.end();
}

// Note: Takes a path relative to the application
Applescript.transformPath = function(unixPath) {
  return [rootPath].concat(unixPath.split("/")).join(":");
};

module.exports = Applescript;

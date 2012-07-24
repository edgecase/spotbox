var child_process = require("child_process");

var Runner = function() {};

Runner.exec = function(command, args, hollaback) {
  var child = child_process.spawn(command, args);
  var result = "";
  var error = ""
  child.stdout.on("data", function(chunk) {
    result += chunk.toString();
  });
  child.stderr.on("data", function(chunk) {
    error += chunk.toString();
  });
  child.on("close", function(code) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, result);
    }
  });
  return child;
};

module.exports = Runner;

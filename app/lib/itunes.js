var path          = require("path");
var fs            = require("fs");
var underscore    = require("underscore");
var config        = require(path.join(__dirname, "..", "..", "config"));
var Applescript   = require(path.join(config.root, "app", "lib", "applescript"));

function exec(applescriptString, hollaback) {
  var str = "tell application \"iTunes\"\n" + applescriptString + "\nend tell"
  Applescript.run(str, hollaback || function(error) { console.log(error) });
}

var Itunes = function() {};

Itunes.add = function(path, hollaback) {
  var asPath = Applescript.transformPath(path);
  var command = "set mytrack to add \"" + asPath + "\"\n";
  command += "return database ID of mytrack";
  exec(command, function(error, idString) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, idString.trim());
    }
  });
};

Itunes.play = function(id) {
  exec("play some track whose database ID is " + id);
};

Itunes.pause = function() {
  exec("pause");
};

Itunes.stop = function() {
  exec("stop");
}

module.exports = Itunes;

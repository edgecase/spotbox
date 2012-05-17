var path        = require("path");
var app         = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var Runner      = require(path.join(app.root, "app", "lib", "runner"));

var Chromaprint = function() {};

Chromaprint.identify = function(filepath, hollaback) {
  var chromaprint = path.join(app.root, "vendor", "fpcalc");

  Runner.exec(chromaprint, [filepath], function(error, output) {
    if (error) {
      hollaback(error);
    } else {
      var response = output.toString().split("\n");
      var result = {
        file: output[0].replace(/FILE=/, ''),
        duration: output[1].replace(/DURATION=/, ''),
        fingerprint: output[2].replace(/FINGERPRINT=/, '')
      };

      hollaback(null, result);
    }
  });
};

module.exports = Chromaprint;

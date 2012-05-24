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
      var splitOutput = output.split("\n");
      var data = {
        file: splitOutput[0].replace(/^FILE=/, ""),
        duration: splitOutput[1].replace(/^DURATION=/, ""),
        fingerprint: splitOutput[2].replace(/^FINGERPRINT=/, "")
      };

      hollaback(null, data);
    }
  });
};

module.exports = Chromaprint;

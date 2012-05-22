var path = require("path");
var app  = require(path.join(__dirname, "..", "config", "app"));
var TrackManager = require(path.join(app.root, "app", "lib", "track_manager"));

module.exports = function(server) {
  server.get("*", function(request, response) {
    response.render("main");
  });

  server.post("/upload", function(request, response) {
    var file = request.files.track;
    if (file) {
      response.json({});
      TrackManager.import(file.path, function() {});
    } else {
      response.send(422);
    }
  });
};

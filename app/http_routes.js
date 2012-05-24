var path = require("path");
var app  = require(path.join(__dirname, "..", "config", "app"));
var TrackManager = require(path.join(app.root, "app", "lib", "track_manager"));

module.exports = function(server) {
  server.get("*", function(request, response) {
    response.render("main");
  });

  server.post("/tracks/", function(request, response) {
    var file = request.files.track;
    if (file) {
      TrackManager.import(file.path, {email: request.session.email || "unknown"}, function(error) {
        if (error) {
          console.log("Track upload error:", error);
          response.send(500);
        } else {
          response.json({});
        }
      });
    } else {
      response.send(422);
    }
  });
};

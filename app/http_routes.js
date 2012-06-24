var path         = require("path");
var passport     = require("passport");
var app          = require(path.join(__dirname, "..", "config", "app"));
var settings     = require(path.join(app.root, "config", "settings"));
var TrackManager = require(path.join(app.root, "app", "lib", "track_manager"));
var authSettings = require(path.join(app.root, "config", "authentication"));

module.exports = function(server) {
  var authenticate = function(request, response, next) {
    if (request.isAuthenticated()) return next();
    response.redirect("/authenticate");
  };

  server.get("*", authenticate, function(request, response) {
    response.render("main");
  });

  server.post("/tracks/", authenticate, function(request, response) {
    var file = request.files.track;
    if (file) {
      TrackManager.import(file.path, file.filename, {email: request.session.email || "unknown"}, function(error) {
        if (error) {
          console.log("Track upload error:", error);
          response.json(error, 422);
        } else {
          response.json({});
        }
      });
    } else {
      response.send(415);
    }
  });
};

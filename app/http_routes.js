var path = require("path");
var app  = require(path.join(__dirname, "..", "config", "app"));
var TrackManager = require(path.join(app.root, "app", "lib", "track_manager"));

function authenticate(request, response, next) {
  if (request.session.email) {
    next();
  } else {
    response.redirect("/auth/google");
  }
};

module.exports = function(server) {
  server.get("*", function(request, response) {
    response.render("main");
  });

  server.post("/tracks/", authenticate, function(request, response) {
    var file = request.files.track;
    if (file) {
      TrackManager.import(file.path, {email: request.session.email || "unknown"}, function(error) {
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

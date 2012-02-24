var path          = require("path");
var fs            = require("fs");
var underscore    = require("underscore");
var http          = require("http");
var config        = require(path.join(__dirname, "..", "config"));
var RequestHelper = require(path.join(config.root, "app", "lib", "request_helper"));
var Spotify       = require(path.join(config.root, "app", "lib", "spotify"));


module.exports = function(server) {
  server.get("/", function(request, response) {
    RequestHelper.render(response, "main");
  });

  server.get("/current", function(request, response) {
    config.redis.get("spotify_current", function(error, trackUri) {
      if (trackUri) {
        Spotify.retrieve(trackUri, function(error, metadata) {
          if (error) {
            response.send(418); // holy shit, I'm an inanimate object
          } else {
            response.json(metadata);
          }
        });
      } else {
        response.json({});
      }
    });
  });

  server.post("/enqueue", function(request, response) {
    var track_uri = request.param("trackuri");
    console.log(track_uri);
    config.redis.rpush("spotify_play_queue", track_uri);
    response.redirect("/");
  });
};

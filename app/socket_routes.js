var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var redis      = require("redis");
var socketio   = require("socket.io");
var config     = require(path.join(__dirname, "..", "config"));
var Spotify    = require(path.join(config.root, "app", "lib", "spotify"));

module.exports = function(server) {
  var redis_subscriptions = redis.createClient();
  var io = socketio.listen(server);

  io.configure(function () {
    io.set("transports", ["websocket"]);
    io.disable("log");
  });

  io.sockets.on("connection", function(socket) {
    config.redis.get("spotify_current", function(error, trackUri) {
      Spotify.retrieve(trackUri, function(error, track) {
        if (error) {
          socket.emit("tracks/current", {error: error});
        } else {
          socket.emit("tracks/current", track);
        }
      });
    });

    socket.on("search", function(message) {
      Spotify.search(message.type, message.query, function(error, result) {
        if (error) {
          socket.emit("search/result", {error: error});
        } else {
          socket.emit("search/result", result);
        }
      });
    });

    socket.on("enqueue", function() {
      // retrieve from spotify
      // push to redis
      // >> broadcast to clients
    });
  });

  redis_subscriptions.on("message", function(channel, trackUri) {
    if (channel === "spotify_current_change") {
      Spotify.retrieve(trackUri, function(error, track) {
        io.sockets.emit("tracks/current", track );
      });
    } else {
      console.log("unknown:", message);
    }
  });

  redis_subscriptions.subscribe("spotify_current_change");
};

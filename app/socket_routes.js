var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var redis      = require("redis");
var socketio   = require("socket.io");
var config     = require(path.join(__dirname, "..", "config"));
var Spotbox    = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify    = require(path.join(config.root, "app", "lib", "spotify"));

module.exports = function(server) {
  var redis_subscriptions = redis.createClient();
  var io = socketio.listen(server);

  function socketEmit(socket, channel, error, result) {
    if (error) {
      socket.emit(channel, {error: error});
    } else {
      socket.emit(channel, result);
    }
  };

  io.configure(function () {
    io.set("transports", ["websocket"]);
    io.disable("log");
  });

  io.sockets.on("connection", function(socket) {
    Spotify.getCurrentTrack(function(error, track) {
      socketEmit(socket, "tracks/current", error, track);
    });

    Spotify.getQueue(function(error, queue) {
      socketEmit(socket, "tracks/queue", error, queue);
    });

    Spotify.getRecentlyPlayed(function(error, tracks) {
      socketEmit(socket, "tracks/recent", error, tracks);
    });

    Spotify.getPlaylists(function(error, playlists) {
      socketEmit(socket, "playlists", error, playlists);
    });

    Spotify.getCurrentPlaylistUri(function(error, uri) {
      socketEmit(socket, "playlists/current", error, uri);
    });


    socket.on("tracks/search", function(message) {
      Spotify.search(message.query, function(error, result) {
        socketEmit(socket, "tracks/search/result", error, result);
      });
    });

    socket.on("tracks/enqueue", function(message) {
      Spotify.enqueue(message, function(error, queue) {
        socketEmit(io.sockets, "tracks/queue", error, queue);
      });
    });

    socket.on("playlists/set", function(message) {
      Spotify.setCurrentPlaylist(message, function(error, uri) {
        socketEmit(io.sockets, "playlists/current", error, uri);
      });
    });
  });

  redis_subscriptions.on("message", function(channel, message) {
    if (channel === Spotbox.namespace("current_track_change")) {
      Spotify.getCurrentTrack(function(error, result) {
        socketEmit(io.sockets, "tracks/current", error, result);
      });
      Spotify.getQueue(function(error, tracks) {
        socketEmit(io.sockets, "tracks/queue", error, tracks);
      });
      Spotify.getRecentlyPlayed(function(error, tracks) {
        socketEmit(io.sockets, "tracks/recent", error, tracks);
      });
    } else {
      console.log("unknown:", message);
    }
  });

  redis_subscriptions.subscribe(Spotbox.namespace("current_track_change"));
};

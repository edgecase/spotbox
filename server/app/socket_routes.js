var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var redis      = require("redis");
var config     = require(path.join(__dirname, "..", "config"));
var Spotbox    = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify    = require(path.join(config.root, "app", "lib", "spotify"));
var Activity   = require(path.join(config.root, "app", "lib", "activity"));

module.exports = function(io) {
  function socketEmit(socket, channel, error, result) {
    if (error) {
      socket.emit(channel, {error: error});
    } else {
      socket.emit(channel, result);
    }
  };

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

    // TODO: ZMQ
    // config.redis.publish(Spotbox.namespace("airfoil:request"), "status");
    socketEmit(socket, "airfoil", null, {volume: 80, status: "connected"});

    socket.on("tracks/search", function(message) {
      Spotify.search(message.query, function(error, result) {
        socketEmit(socket, "tracks/search/result", error, result);
      });
    });

    socket.on("tracks/enqueue", function(message) {
      Spotify.enqueue(message, function(error, queue) {
        socketEmit(io.sockets, "tracks/queue", error, queue);
        Spotify.retrieve(message, function(error, track) {
          socketEmit(io.sockets, "activities", error, Activity.build(socket, "Enqueued " + track.track.name));
        });
      });
    });

    socket.on("playlists/set", function(message) {
      Spotify.setCurrentPlaylist(message, function(error, uri) {
        socketEmit(io.sockets, "playlists/current", error, uri);
        Spotify.getPlaylist(uri, function(error, playlist) {
          socketEmit(io.sockets, "activities", error, Activity.build(socket, "Changed playlist to " + playlist.name));
        });
      });
    });

    socket.on("player", function(message) {
      config.redis.publish(Spotbox.namespace("player"), message);
      socketEmit(io.sockets, "activities", null, Activity.build(socket, "Pressed " + message));
    });

    socket.on("airfoil", function(message) {
      config.redis.publish(Spotbox.namespace("airfoil:request"), message);
      socketEmit(io.sockets, "activities", null, Activity.build(socket, "Sent Airfoil commaned " + message));
    });
  });

  // redisSubscriptions.on("message", function(channel, message) {
  //   if (channel === Spotbox.namespace("current_track_change")) {
  //     Spotify.getCurrentTrack(function(error, result) {
  //       socketEmit(io.sockets, "tracks/current", error, result);
  //     });
  //     Spotify.getQueue(function(error, tracks) {
  //       socketEmit(io.sockets, "tracks/queue", error, tracks);
  //     });
  //     Spotify.getRecentlyPlayed(function(error, tracks) {
  //       socketEmit(io.sockets, "tracks/recent", error, tracks);
  //     });
  //   } else if (channel === Spotbox.namespace("airfoil:response")) {
  //     socketEmit(io.sockets, "airfoil", null, JSON.parse(message));
  //   } else {
  //     console.log("unknown socket message: ", message);
  //   }
  // });

  // redisSubscriptions.subscribe(Spotbox.namespace("current_track_change"), Spotbox.namespace("airfoil:response"));
};

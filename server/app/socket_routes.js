var path       = require("path");
var fs         = require("fs");
var underscore = require("underscore");
var config     = require(path.join(__dirname, "..", "config"));
var Spotbox    = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify    = require(path.join(config.root, "app", "lib", "spotify"));
var Activity   = require(path.join(config.root, "app", "lib", "activity"));
var Airfoil    = require(path.join(config.root, "app", "lib", "airfoil"));
var Player     = require(path.join(config.root, "app", "lib", "player"));


module.exports = function(io) {
  function socket_emit(socket, channel, error, result) {
    if (error) {
      socket.emit(channel, {error: error});
    } else {
      socket.emit(channel, result);
    }
  };

  io.sockets.on("connection", function(socket) {
    // Populate initial state for new client
    Player.get_track(function(error, track) {
      socket_emit(socket, "player/track", error, track);
    });

    Player.get_queue(function(error, queue) {
      socket_emit(socket, "tracks/queue", error, queue);
    });

    Player.get_recent(function(error, tracks) {
      socket_emit(socket, "tracks/recent", error, tracks);
    });

    Player.get_playlists(function(error, playlists) {
      socket_emit(socket, "playlists", error, playlists);
    });

    Player.get_playlist_uri(function(error, uri) {
      socket_emit(socket, "playlists/current", error, uri);
    });

    Airfoil.check_status();
    socket_emit(socket, "airfoil", null, Airfoil.status());


    // Respond to user actions
    socket.on("tracks/search", function(message) {
      Spotify.search(message.query, function(error, result) {
        socket_emit(socket, "tracks/search/result", error, result);
      });
    });

    socket.on("tracks/enqueue", function(message) {
      Spotify.retrieve(message, function(error, track) {
        if (track) {
          Player.add_to_queue(track.href);
          socket_emit(io.sockets, "activities", null, Activity.build(socket, "Enqueued " + track.name));
        }
      });
    });

    socket.on("playlists/set", function(message) {
      Player.get_playlist(message, function(error, playlist) {
        if (playlist) {
          socket_emit(io.sockets, "activities", null, Activity.build(socket, "Changed playlist to " + playlist.name));
          Player.set_playlist_uri(playlist.href);
        }
      });
    });

    socket.on("player", function(message) {
      Player[message]();
    });

    socket.on("airfoil", function(message) {
      Airfoil[message]();
      socket_emit(io.sockets, "activities", null, Activity.build(socket, "Sent Airfoil commaned " + message));
    });
  });


  // Inform browser of player state changes
  Player.on("state", function(properties) {
    socket_emit(io.sockets, "player/state", null, {state:properties.state});
  });

  Player.on("progress", function(properties) {
    socket_emit(io.sockets, "player/progress", null, {progress:properties.progress});
  });

  Player.on("track", function(properties) {
    if (properties.track) {
      Spotify.retrieve(properties.track, function(error, track) {
        socket_emit(io.sockets, "player/track", error, {track:track});
      });
    }
  });

  Player.on("playlist", function(properties) {
    socket_emit(io.sockets, "playlists/current", null, properties.playlist);
  });

  Player.on("queue", function(properties) {
    Player.get_queue(function(errors, tracks) {
      socket_emit(io.sockets, "tracks/queue", errors, tracks);
    });
  });

  Player.on("recent", function(properties) {
    Player.get_recent(function(errors, tracks) {
      socket_emit(io.sockets, "tracks/recent", errors, tracks);
    });
  });


  // Inform browser of airfoil status changes
  Airfoil.on("volume", function(properties) {
    socket_emit(io.sockets, "airfoil", null, properties);
  });

  Airfoil.on("connection_status", function(properties) {
    socket_emit(io.sockets, "airfoil", null, properties);
  });
};

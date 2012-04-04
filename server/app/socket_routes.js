var path            = require("path");
var fs              = require("fs");
var underscore      = require("underscore");
var config          = require(path.join(__dirname, "..", "config"));
var Spotbox         = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify         = require(path.join(config.root, "app", "lib", "spotify"));
var Airfoil         = require(path.join(config.root, "app", "lib", "airfoil"));
var Player          = require(path.join(config.root, "app", "lib", "player"));
var PlaylistManager = require(path.join(config.root, "app", "lib", "playlist_manager"));

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
    Player.get_state(function(error, state) {
      socket_emit(socket, "player/state", error, state);
    });

    Player.get_track(function(error, track) {
      socket_emit(socket, "player/track", error, { track: track });
    });

    Player.get_next_votes(function(error, votes) {
      socket_emit(socket, "player/next_votes", error, votes);
    });

    Player.get_queue(function(error, queue) {
      socket_emit(socket, "tracks/queue", error, queue);
    });

    Player.get_recent(function(error, tracks) {
      socket_emit(socket, "tracks/recent", error, tracks);
    });

    PlaylistManager.get_playlists(function(error, playlists) {
      playlists = underscore.map(playlists, function(value, key) {
        return { uri: key, name: value };
      });
      socket_emit(socket, "playlists", error, playlists);
    });

    PlaylistManager.get_playlist_uri(function(error, uri) {
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
        }
      });
    });

    socket.on("tracks/dequeue", function(track) {
      Player.remove_from_queue(track);
    });

    socket.on("playlists/set", function(uri) {
      PlaylistManager.get_playlist(uri, function(error, playlist) {
        if (playlist) {
          PlaylistManager.set_playlist_uri(uri);
        }
      });
    });

    socket.on("player", function(message) {
      if (message === "play") {
        Player.play();
      } else if (message === "pause") {
        Player.pause();
      } else if (message === "stop") {
        Player.stop();
      } else if (message === "next") {
        Player.next_vote(socket.handshake.address.address);
      }
    });

    socket.on("airfoil", function(message) {
      Airfoil[message]();
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

  Player.on("next_votes", function(properties) {
    socket_emit(io.sockets, "player/next_votes", null, underscore.size(properties.next_votes));
  });

  PlaylistManager.on("current", function(properties) {
    socket_emit(io.sockets, "playlists/current", null, properties.current);
  });


  // Inform browser of airfoil status changes
  Airfoil.on("volume", function(properties) {
    socket_emit(io.sockets, "airfoil", null, properties);
  });

  Airfoil.on("connection_status", function(properties) {
    socket_emit(io.sockets, "airfoil", null, properties);
  });
};

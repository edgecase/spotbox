var path            = require("path");
var fs              = require("fs");
var underscore      = require("underscore");
var config          = require(path.join(__dirname, "..", "config"));
var Spotbox         = require(path.join(config.root, "app", "lib", "spotbox"));
var Spotify         = require(path.join(config.root, "app", "lib", "spotify"));
var Airfoil         = require(path.join(config.root, "app", "lib", "airfoil"));
var Player          = require(path.join(config.root, "app", "lib", "player"));
var Stats           = require(path.join(config.root, "app", "lib", "stats"));
var PlaylistManager = require(path.join(config.root, "app", "lib", "playlist_manager"));
var AlbumInfo       = require(path.join(config.root, "app", "lib", "album_info"));

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
      AlbumInfo.retrieve(track, function(err, albumInfo) {
        socket_emit(socket, "player/track", error, { track: track });
      });
    });

    Player.getDisapprovalPercentage(function(error, percentage) {
      socket_emit(socket, "player/disapproval_percentage", error, percentage);
    });

    Player.get_queue(function(error, queue) {
      socket_emit(socket, "tracks/queue", error, queue);
    });

    Player.get_played_tracks(function(error, tracks) {
      socket_emit(socket, "tracks/played", error, tracks);
    });

    PlaylistManager.get_playlists(function(error, playlists) {
      playlists = underscore.map(playlists, function(value, key) {
        return { id: key, name: value };
      });
      socket_emit(socket, "playlists", error, playlists);
    });

    PlaylistManager.get_playlist_id(function(error, id) {
      socket_emit(socket, "playlists/current/id", error, id);
      PlaylistManager.get_playlist_tracks(id, function(errors, tracks) {
        socket_emit(socket, "playlists/current/tracks", errors, tracks);
      });
    });

    Stats.top_played(function(error, result) {
      socket_emit(socket, "stats/top_played", error, result);
    });

    Stats.top_skipped(function(error, result) {
      socket_emit(socket, "stats/top_skipped", error, result);
    });

    Stats.top_artists(function(error, result) {
      socket_emit(socket, "stats/top_artists", error, result);
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
          Player.add_to_queue(track.id);
        }
      });
    });

    socket.on("playlists/set", function(id) {
      PlaylistManager.get_playlist(id, function(error, playlist) {
        if (playlist) {
          PlaylistManager.set_playlist_id(id);
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
        AlbumInfo.retrieve(track, function(err, albumInfo) {
          socket_emit(io.sockets, "player/track", error, {track:track});
        });
      });
    }
  });

  Player.on("queue", function(properties) {
    Player.get_queue(function(errors, tracks) {
      socket_emit(io.sockets, "tracks/queue", errors, tracks);
    });
  });

  Player.on("played", function(properties) {
    Player.get_played_tracks(function(errors, tracks) {
      socket_emit(io.sockets, "tracks/played", errors, tracks);
    });
  });

  Player.on("next_votes", function(properties) {
    Player.getDisapprovalPercentage(function(errors, percent) {
      socket_emit(io.sockets, "player/disapproval_percentage", null, percent);
    });
  });

  PlaylistManager.on("current", function(properties) {
    socket_emit(io.sockets, "playlists/current/id", null, properties.current);
    PlaylistManager.get_playlist_tracks(properties.current, function(errors, tracks) {
      socket_emit(io.sockets, "playlists/current/tracks", errors, tracks);
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

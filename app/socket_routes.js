var path        = require("path");
var fs          = require("fs");
var underscore  = require("underscore");
var AsyncRunner = require("async_runner");
var app         = require(path.join(__dirname, "..", "config", "app"));
var Spotbox     = require(path.join(app.root, "app", "lib", "spotbox"));
var Player      = require(path.join(app.root, "app", "lib", "player"));
var TrackQueue  = require(path.join(app.root, "app", "lib", "track_queue"));
var AlbumInfo   = require(path.join(app.root, "app", "lib", "album_info"));
var Airfoil     = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));
var Itunes      = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Spotify     = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));

module.exports = function(io) {
  function socketEmit(socket, channel, error, result) {
    if (error) {
      socket.emit(channel, {error: error});
    } else {
      socket.emit(channel, result);
    }
  };

  io.sockets.on("connection", function(socket) {
    // Populate initial state
    (function() {
      var properties = Player.properties;
      // socketEmit(socket, "player/state", null, properties.state);
      // socketEmit(socket, "player/track", null, properties.track);
      // socketEmit(socket, "player/queue", null, properties.queue);
      //
      // Airfoil.status(function(error, properties) {
      //   socketEmit(socket, "airfoil", null, properties);
      // });
    })();


    // Track interface
    socket.on("tracks/search", function(message) {
      var runner = new AsyncRunner(function(errors, results) {
        if (errors) {
          socketEmit(socket, "tracks/search", errors, null);
        } else {
          var searchResults = {
            itunes: results[0],
            spotify: results[1]
          };
          socketEmit(socket, "tracks/search", null, searchResults);
        }
      });
      var jobs = [
        function(element, hollaback) {
          Itunes.search(element, hollaback);
        },
        function(element, hollaback) {
          Spotify.search(element, hollaback);
        }
      ];
      runner.run(message, jobs);
    });


    // Player interface
    socket.on("player/enqueue", function(message) {
      TrackQueue.enqueue(message, function(error, result) {
        socketEmit(socket, "player/enqueue", error, result);
      });
    });

    socket.on("player/command", function(message) {
      if (message === "play") {
        Player.play(null, function() {});
      } else if (message === "pause") {
        Player.pause(function() {});
      } else if (message === "stop") {
        Player.stop(function() {});
      } else if (message === "next") {
        Player.vote(socket.handshake.address.address);
      } else {
        console.error("unsupported player command", message);
      }
    });

    // Airfoil interface
    socket.on("airfoil", function(message) {
      if (message === "connect") {
        Airfoil.connect(function() {});
      } else if (message === "disconnect") {
        Airfoil.disconnect(function() {});
      } else if (message === "volumeUp") {
        Airfoil.volumeUp();
      } else if (message === "volumeDown") {
        Airfoil.volumeDown();
      }
    });
  });


  // Inform browser of player state changes
  // Player.on("state", function(properties) {
  //   socketEmit(io.sockets, "player/state", null, {state:properties.state});
  // });
//
//   Player.on("progress", function(properties) {
//     socketEmit(io.sockets, "player/progress", null, {progress:properties.progress});
//   });
//
//   Player.on("track", function(properties) {
//     // TODO: multi endpoint support
//   });
//
//   Player.on("queue", function(properties) {
//     socketEmit(io.sockets, "tracks/queue", null, Player.queue);
//   });
//
//   Player.on("votes", function(properties) {
//     // TODO:
//   });


  // Inform browser of airfoil status changes
  // Airfoil.on("volume", function(properties) {
  //   socketEmit(io.sockets, "airfoil", null, properties);
  // });

  // Airfoil.on("connection", function(properties) {
  //   socketEmit(io.sockets, "airfoil", null, properties);
  // });
};

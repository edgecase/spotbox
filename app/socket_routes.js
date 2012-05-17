var path            = require("path");
var fs              = require("fs");
var underscore      = require("underscore");
var app             = require(path.join(__dirname, "..", "config", "app"));
var Spotbox         = require(path.join(app.root, "app", "lib", "spotbox"));
var Player          = require(path.join(app.root, "app", "lib", "player"));
var AlbumInfo       = require(path.join(app.root, "app", "lib", "album_info"));
var Airfoil         = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));

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
    })();

    // Airfoil.status(function(error, properties) {
    //   socketEmit(socket, "airfoil", null, properties);
    // });


    // Respond to client requests
    socket.on("tracks/enqueue", function(message) {
      Player.enqueue(message, function(error, result) {
        socketEmit(socket, "player/enqueue", error, result);
      });
    });

    socket.on("player", function(message) {
      if (message === "play") {
        Player.play(null, function() {});
      } else if (message === "pause") {
        Player.pause();
      } else if (message === "stop") {
        Player.stop();
      } else if (message === "next") {
        Player.vote(socket.handshake.address.address);
      }
    });

    // socket.on("airfoil", function(message) {
    //   // TODO:
    // });
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

var path         = require("path");
var fs           = require("fs");
var underscore   = require("underscore");
var AsyncRunner  = require("async_runner");
var app          = require(path.join(__dirname, "..", "config", "app"));
var Spotbox      = require(path.join(app.root, "app", "lib", "spotbox"));
var Player       = require(path.join(app.root, "app", "lib", "player"));
var TrackManager = require(path.join(app.root, "app", "lib", "track_manager"));
var AlbumInfo    = require(path.join(app.root, "app", "lib", "album_info"));
var Airfoil      = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));
var Itunes       = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Spotify      = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Users        = require(path.join(app.root, "app", "lib", "users"));

module.exports = function(io) {
  function authenticate(socket, hollaback) {
    try {
      hollaback(null, socket.handshake.session.user);
    } catch (e) {
      hollaback({error: "authentication"});
    }
  };

  io.sockets.on("connection", function(socket) {
    authenticate(socket, function(error, user) {
      if (error || !user) {
        socket.emit("reload");
        return;
      }

      Users.add(user);
      io.sockets.emit("users", Users.list());

      socket.on("disconnect", function () {
        Users.remove(user);
        io.sockets.emit("users", Users.list());
      });

      // Populate initial state
      (function() {
        var properties = Player.properties();
        socket.emit("spotbox/version", Spotbox.version);
        socket.emit("tracks/queue", TrackManager.queue());
        socket.emit("player/state", properties.state);
        socket.emit("player/track", properties.track);
        Airfoil.status(function(error, properties) {
          socket.emit("airfoil", properties);
        });
      })();


      // Track interface
      socket.on("tracks/search", function(message) {
        var runner = new AsyncRunner(function(errors, results) {
          if (errors) {
            socket.emit("error", errors);
          } else {
            var searchResults = {
              itunes: results[0],
              spotify: results[1]
            };
            socket.emit("tracks/search", searchResults);
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

      socket.on("tracks/enqueue", function(message) {
        TrackManager.enqueue(message, user, function(error, result) {
          if (error) {
            socket.emit("error", error);
          } else {
            socket.emit("player/enqueue", result);
          }
        });
      });

      socket.on("tracks/uploads", function(message) {
        TrackManager.userUploads(user, function(error, tracks) {
          if (error) {
            socket.emit("error", message);
          } else {
            socket.emit("uploads/list", tracks);
          }
        });
      });

      // TODO: Just send the ID
      // TODO: Display current votes
      socket.on("tracks/rating", function(track, rating) {
        if (rating === "up" || rating === "down") {
          TrackManager.vote(track.id, user, rating, function(error, result) {
            if (track.id === Player.properties.track.id) {
              TrackManager.score(track.id, function(error, score) {
                if (score < 0) {
                  TrackManager.next(function() {});
                }
              });
            }
          });
        }
      });


      // Player interface
      socket.on("player/command", function(message) {
        if (message === "unpause") {
          Player.play(function(error) {});
        } else if (message === "pause") {
          Player.pause(function() {});
        } else {
          socket.emit("error", message);
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
        } else {
          socket.emit("error", message);
        }
      });
    });


    // Inform browser of changes in the queue
    TrackManager.on("queue", function(properties) {
      io.sockets.emit("tracks/queue", properties.queue);
    });


    // Inform browser of player state changes
    Player.on("state", function(properties) {
      io.sockets.emit("player/state", properties.state);
    });

    Player.on("progress", function(properties) {
      io.sockets.emit("player/progress", properties.progress);
    });

    Player.on("track", function(properties) {
      io.sockets.emit("player/track", properties.track);
    });


    // Inform browser of airfoil status changes
    Airfoil.on("volume", function(properties) {
      io.sockets.emit("airfoil", properties);
    });

    Airfoil.on("connection", function(properties) {
      io.sockets.emit("airfoil", properties);
    });
  });
};

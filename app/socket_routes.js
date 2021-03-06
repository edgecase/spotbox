var path         = require("path");
var fs           = require("fs");
var querystring  = require("querystring");
var socketio     = require("socket.io");
var cookie       = require("cookie");
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

module.exports = function(server, sessionStore) {
  var io = socketio.listen(server);
  io.configure(function () {
    io.set("transports", ["websocket"]);
    io.disable("log");
    io.set("authorization", function(data, hollaback) {
      var sid = cookie.parse(data.headers.cookie)["connect.sid"];
      if (!sid) return hollaback(null, false);
      var parsedSessionId = sid.match(/s:([^.]*)/)[1];
      sessionStore.get(parsedSessionId, function(error, session) {
        if (error) return hollaback(error);
        if (session) {
          data.session = session;
          hollaback(null, true);
        } else {
          hollaback(null, false);
        }
      });
    });
  });

  function authenticate(socket, hollaback) {
    try {
      hollaback(null, socket.handshake.session.passport.user);
    } catch (e) {
      socket.emit("reload");
    }
  };

  function refreshLikes(user, socket) {
    TrackManager.liked(user, function(error, tracks) {
      if (error) return socket.emit("messages/error", error);
      socket.emit("tracks/liked", tracks);
    });
    TrackManager.disliked(user, function(error, tracks) {
      if (error) return socket.emit("messages/error", errors);
      socket.emit("tracks/disliked", tracks);
    });
  };

  function refreshVotes(track) {
    TrackManager.metadata(track.id, function(error, track) {
      if (error) return;
      io.sockets.emit("votes", track.meta.votes || {});
    });
  };

  function refreshUploads(user, socket) {
    TrackManager.userUploads(user, function(error, tracks) {
      if (error) return socket.emit("messages/error", error);
      socket.emit("uploads", tracks);
    });
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
        refreshLikes(user, socket);
        refreshUploads(user, socket);
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
            socket.emit("messages/error", error);
          } else {
            socket.emit("player/enqueue", result);
            socket.emit("messages/success", null, "Enqueued track");
          }
        });
      });

      socket.on("tracks/uploads", function(message) {
        refreshUploads(user, socket);
      });

      socket.on("tracks/rating", function(track, rating) {
        if (rating === "up" || rating === "down") {
          TrackManager.vote(track.id, user, rating, function(error, result) {
            if (error) return;
            refreshLikes(user, socket);
            if (track.id === Player.properties().track.id) {
              refreshVotes(Player.properties().track);
              TrackManager.score(track.id, function(error, score) {
                if (score < 0) {
                  Player.next(function() {});
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
      refreshVotes(properties.track);
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

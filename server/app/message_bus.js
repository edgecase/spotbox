var zmq     = require("zmq");
var path    = require("path");
var config  = require(path.join(__dirname, "..", "config"));
var Spotbox = require(path.join(config.root, "app", "lib", "spotbox"));

var MessageBus = (function(self, zmq) {
  var sub = zmq.socket("sub")
    , pub = zmq.socket("pub")
    , sub_addr = "tcp://127.0.0.1:12003"
    , pub_addr = "tcp://127.0.0.1:12002";

  // Parses messages sent to controller from C land
  //   msg = destination::method::argument[::argument]
  //
  var parseMessage = function(msg) {
    var fullMessage = msg.toString().split("::");

    console.log(fullMessage);

    return {
        destination : fullMessage[0]
      , method      : fullMessage[1]
      , args        : fullMessage.slice(2)
    }
  }

  // Uses websocket to report track progress
  //   socket  - websocket to report progress to server
  //   args[0] - spotify:track:uri
  //   args[1] - progress in seconds
  //
  var reportTrackProgress = function(socket, args) {
    socket.emit("tracks/current/progress", { progress: args[1]});
  };

  var messageDispatch = function(socket) {
    sub.on("message", function(msg) {
      var data = parseMessage(msg);

      if (data.method === "track_progress") {
        reportTrackProgress(socket, data.args);
      } else {
        console.log("unsupported message: ", msg.toString());
      }
    });
  };

  // Sets up following connections:
  //   Web App <= Message Bus <= 0mq
  //   Web App => Message Bus => 0mq
  //
  self.init = function(io) {
    sub.connect(sub_addr);
    pub.bindSync(pub_addr);
    sub.subscribe("");

    sub.on("message", function(msg) {
      var data = parseMessage(msg);

      if (data.method === "track_progress") {
        reportTrackProgress(io.sockets, data.args);
      } else {
        console.log("unsupported message: ", msg.toString());
      }
    });

    io.sockets.on("connection", function(socket) {
      socket.on("player", function(message) {
        pub.send(Spotbox.namespace("controller::" + message));
      });
    });
  };

  return self;

}({}, zmq));

module.exports = MessageBus.init;

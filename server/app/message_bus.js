var path    = require("path");
var config  = require(path.join(__dirname, "..", "config"));
var Spotbox = require(path.join(config.root, "app", "lib", "spotbox"));

var MessageBus = (function(self, zmq) {
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

  // Sets up following connections:
  //   Web App <= Message Bus <= 0mq
  //   Web App => Message Bus => 0mq
  //
  self.init = function(io) {
    config.controller_sub.on("message", function(msg) {
      var data = parseMessage(msg);

      if (data.method === "track_progress") {
        reportTrackProgress(io.sockets, data.args);
      } else {
        console.log("unsupported message: ", msg.toString());
      }
    });
  };

  return self;

}({}, zmq));

module.exports = MessageBus.init;

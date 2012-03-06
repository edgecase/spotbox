var zmq      = require("zmq")
  , socketio = require("socket.io");

var MessageBus = (function(self, zmq) {
  var sub = zmq.socket("sub")
    , pub = zmq.socket("pub")
    , sub_addr = "tcp://127.0.0.1:12001"
    , pub_addr = "tcp://127.0.0.1:12000";

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
    console.log("report track progress: ", args);
  };

  var messageDispatch = function(socket) {
    console.log("message dispatch init");

    sub.on("message", function(msg) {
      console.log("HEY", msg.toString());

      var data = parseMessage(msg);

      if (data.method === "trackprogress") {
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
  self.init = function(server) {
    var io = socketio.listen(server);
    /* io.configure(function () { io.disable("log") }); */

    sub.connect(sub_addr);
    pub.bindSync(pub_addr);
    sub.subscribe("spotbox:server");

    // set up messageDispatch handlers. Web socket is passed in.
    io.sockets.on("connection", messageDispatch);
  };

  return self;

}({}, zmq));

module.exports = MessageBus.init;


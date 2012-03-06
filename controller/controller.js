var zmq = require("zmq")

var Controller = (function(self, zmq) {
  var sub = zmq.socket("sub"),
      pub = zmq.socket("pub"),
      sub_addr = "tcp://127.0.0.1:12000",
      pub_addr = "tcp://127.0.0.1:12001";

  // Parses messages sent to controller from C land
  //   msg = destination::method::argument[::argument]
  //
  var parseMessage = function(msg) {
    var fullMessage = msg.toString().split("::");

    return {
        destination : fullMessage[0]
      , method      : fullMessage[1]
      , args        : fullMessage.slice(2)
    }
  }

  // Tells the app the progress of a track
  //   args[0] = spotify:track:uri
  //   args[1] = track progress in seconds
  //
  var trackProgress = function(args) {
    msg = [ "spotbox:server",     // destination
            "trackprogress",      // method
            args[0],              // track
            args[1]].join("::");  // progress

    pub.send(msg);
  };

  // Initialize zmq message handlers
  //
  self.init = function() {
    sub.connect(sub_addr);
    pub.bindSync(pub_addr);
    sub.subscribe("");

    sub.on("message", function(msg) {
      var data = parseMessage(msg);

      console.log("controller msg: ", msg.toString());
      if (data.method === "playing") {
        console.log("progress");
        trackProgress(data.args);
      } else if (data.method === "stopped") {
        console.log("simulate user stopping track");
      } else {
        console.log("unsupported message: ", msg.toString());
      }
    });

    // Simulations
    setTimeout(function() {
      pub.send("spotbox:players:spotify::play::spotify:track:18lwMD3frXxiVWBlztdijW");
    }, 3000);

    setTimeout(function() {
      pub.send("spotbox:players:spotify::stop");
      pub.send("spotbox:players:spotify::play::spotify:track:07KHJvlYBeQVqrmifTEqEp");
    }, 10000);
  };

  return self;

}({}, zmq));

// Initialize controller, registering zmq handlers
Controller.init();


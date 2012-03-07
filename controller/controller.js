var zmq   = require("zmq")
var redis = require("redis").createClient();

var Controller = (function(self, zmq) {
  var backend_sub       = zmq.socket("sub"),
      frontend_sub      = zmq.socket("sub"),
      backend_pub       = zmq.socket("pub"),
      frontend_pub      = zmq.socket("pub"),
      backend_sub_addr  = "tcp://127.0.0.1:12001",
      frontend_sub_addr = "tcp://127.0.0.1:12002",
      backend_pub_addr  = "tcp://127.0.0.1:12000";
      frontend_pub_addr = "tcp://127.0.0.1:12003";

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

    frontend_pub.send(msg);
  };

  // Initialize zmq message handlers
  //
  self.init = function() {
    backend_sub.connect(backend_sub_addr);
    frontend_sub.connect(frontend_sub_addr);
    backend_pub.bindSync(backend_pub_addr);
    frontend_pub.bindSync(frontend_pub_addr);
    backend_sub.subscribe("spotbox:controller");
    frontend_sub.subscribe("spotbox:controller");

    backend_sub.on("message", function(msg) {
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

    frontend_sub.on("message", function(msg) {
      var data = parseMessage(msg);
      if (data.method === "play") {
        var uri = null;
        redis.lpop("spotbox:play_queue", function(error, data) {
          // TODO this should work but doesn't
          if (data) {
            uri = data;
          } else {
            // nothing in the queue
            uri = "spotify:track:18lwMD3frXxiVWBlztdijW";
          }
        });
        redis.set("spotbox:current_track", uri);
        console.log(uri);
        backend_pub.send("spotbox:players:spotify::play::" + uri);
      } else if (data.method === "stop") {
        redis.del("spotbox:current_track");
        backend_pub.send("spotbox:players:spotify::stop");
      }
    });
  };

  return self;

}({}, zmq));

// Initialize controller, registering zmq handlers
Controller.init();


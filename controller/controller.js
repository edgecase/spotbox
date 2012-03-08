var zmq   = require("zmq");
var redis = require("redis").createClient();

var Controller = (function(self, zmq, redis) {
  var playState         = "stop",
      backend_sub       = zmq.socket("sub"),
      frontend_sub      = zmq.socket("sub"),
      backend_pub       = zmq.socket("pub"),
      frontend_pub      = zmq.socket("pub"),
      backend_sub_addr  = "tcp://127.0.0.1:12001",
      frontend_sub_addr = "tcp://127.0.0.1:12002",
      backend_pub_addr  = "tcp://127.0.0.1:12000",
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
  };

  // Tells the app the progress of a track
  //   args[0] = spotify:track:uri
  //   args[1] = track progress in seconds
  //
  var trackProgress = function(args) {
    msg = ["spotbox:server",     // destination
           "track_progress",     // method
           args[0],              // track
           args[1]].join("::");  // progress

    frontend_pub.send(msg);
  };

  var stopPlaying = function() {
    redis.del("spotbox:current_track");
    backend_pub.send("spotbox:players:spotify::stop");
    playState = "stop";
  };

  var playNext = function(args) {
    var uri = null;
    redis.lpop("spotbox:play_queue", function(error, data) {
      // TODO this should work but doesn't
      uri = (data ? data : "spotify:track:18lwMD3frXxiVWBlztdijW"); //brassmonkey
      redis.set("spotbox:current_track", uri);
      backend_pub.send("spotbox:players:spotify::play::" + uri);
    });
    playState = "play";
  };

  var pauseTrack = function() {
    if (playState == "play") {
      backend_pub.send("spotbox:players:spotify::pause");
      playState = "pause";
    } else if (playState == "pause") {
      backend_pub.send("spotbox:players:spotify::unpause");
      playState = "play";
    } else if (playState == "stop") {
      // lol wut?
    }
  };

  // Initialize zmq message handlers
  //
  self.init = function(redis) {
    backend_sub.connect(backend_sub_addr);
    frontend_sub.connect(frontend_sub_addr);
    backend_pub.bindSync(backend_pub_addr);
    frontend_pub.bindSync(frontend_pub_addr);
    backend_sub.subscribe("spotbox:controller");
    frontend_sub.subscribe("spotbox:controller");

    backend_sub.on("message", function(msg) {
      var data = parseMessage(msg);

      if (data.method === "playing") {
        trackProgress(data.args);
      } else {
        console.log("unsupported message: ", msg.toString());
      }
    });

    frontend_sub.on("message", function(msg) {
      var data = parseMessage(msg);

      if (data.method === "play") {
        playNext();
      } else if (data.method === "stop") {
        stopPlaying();
      } else if (data.method === "pause") {
        pauseTrack();
      } else {
        console.log("unsupported message: ", msg.toString());
      }
    });
  };

  return self;

}({}, zmq, redis));

// Initialize controller, registering zmq handlers
Controller.init();


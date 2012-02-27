var child_process = require("child_process");
var Redis         = require("redis");

var redis              = Redis.createClient();
var redisSubscriptions = Redis.createClient();

function shellOut(command, args, hollaback) {
  var child = child_process.spawn(command, args);
  var result = "";
  child.stdout.on("data", function(chunk) {
    result += chunk.toString();
  });
  child.stderr.on("data", function(chunk) {
    hollaback(chunk.toString());
  });
  child.on("exit", function(code) {
    hollaback(null, result);
  });
};

var volume = 20;
var Airfoil = function() {};
var Spotbox = function() {};

Spotbox.namespace = function(str) {
  return "spotbox:" + str;
};

Airfoil.status = function(hollaback) {
  shellOut("osascript", ["./airfoil_status.scpt"], function(error, result) {
    if (result.trim() === "true") {
      hollaback(null, {volume: volume, status: "connected"});
    } else {
      hollaback(null, {volume: volume, status: "disconnected"});
    }
  });
};

Airfoil.connect = function(hollaback) {
  shellOut("osascript", ["./airfoil_connect.scpt", volume / 100.0], function(error, result) {
    setTimeout(function() {Airfoil.status(hollaback)}, 4000);
  });
};

Airfoil.disconnect = function(hollaback) {
  shellOut("osascript", ["./airfoil_disconnect.scpt"], function(error, result) {
    Airfoil.status(hollaback);
  });
};

Airfoil.setVolume = function(hollaback) {
  shellOut("osascript", ["./airfoil_volume.scpt", volume / 100.0], function(error, result) {
    Airfoil.status(hollaback);
  });
}

function publishStatus(error, status) {
  if (!error) {
    console.log("status: ", status);
    redis.publish(Spotbox.namespace("airfoil:response"), JSON.stringify(status));
  }
};


redisSubscriptions.on("message", function(channel, message) {
  console.log(channel, message);
  if (channel === Spotbox.namespace("airfoil:request")) {
    if (message === "volumeUp") {
      volume += 5;
      Airfoil.setVolume(publishStatus);
    } else if (message === "volumeDown") {
      volume -= 5;
      Airfoil.setVolume(publishStatus);
    } else if (message === "connect") {
      Airfoil.connect(publishStatus);
    } else if (message === "disconnect") {
      Airfoil.disconnect(publishStatus);
    } else if (message === "status") {
      Airfoil.status(publishStatus);
    }
  }
});

redisSubscriptions.subscribe(Spotbox.namespace("current_track_change"), Spotbox.namespace("airfoil:request"));

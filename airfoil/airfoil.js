var child_process = require("child_process");
var zmq           = require("zmq");
var webapp_addr   = "tcp://127.0.0.1:12003";
var pub_addr      = "tcp://127.0.0.1:12004";
var webapp_sub    = zmq.socket("sub");
var pub           = zmq.socket("pub");

var volume = 20;

function shell_out(command, args, hollaback) {
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

function publishStatus(error, data) {
  if (!error) {
    var payload = [
      Spotbox.namespace("webapp"), // destination
      "status",                    // method
      data.status,                 // status
      data.volume                  // volume
    ].join("::");
    pub.send(payload);
  }
};

var Spotbox = function() {};
Spotbox.namespace = function(str) {
  return "spotbox:" + str;
};

Spotbox.parse_message = function(msg) {
  var fullMessage = msg.toString().split("::");
  return {
      destination : fullMessage[0]
    , method      : fullMessage[1]
    , args        : fullMessage.slice(2)
  }
};

var Airfoil = function() {};
Airfoil.status = function(hollaback) {
  shell_out("osascript", ["./airfoil_status.scpt"], function(error, result) {
    if (result.trim() === "true") {
      hollaback(null, {volume: volume, status: "connected"});
    } else {
      hollaback(null, {volume: volume, status: "disconnected"});
    }
  });
};

Airfoil.connect = function(hollaback) {
  shell_out("osascript", ["./airfoil_connect.scpt", volume / 100.0], function(error, result) {
    setTimeout(function() {Airfoil.status(hollaback)}, 4000);
  });
};

Airfoil.disconnect = function(hollaback) {
  shell_out("osascript", ["./airfoil_disconnect.scpt"], function(error, result) {
    Airfoil.status(hollaback);
  });
};

Airfoil.setVolume = function(hollaback) {
  shell_out("osascript", ["./airfoil_volume.scpt", volume / 100.0], function(error, result) {
    Airfoil.status(hollaback);
  });
}

pub.bindSync();
webapp_sub.connect();
webapp_sub.subscribe(Spotbox.namespace("airfoil::"));
webapp_sub.on("message", function(msg) {
  var method = Spotbox.parse_message(msg).method;
  if (method === "volumeUp") {
    volume += 5;
    Airfoil.setVolume(publishStatus);
  } else if (method === "volumeDown") {
    volume -= 5;
    Airfoil.setVolume(publishStatus);
  } else if (method === "connect") {
    Airfoil.connect(publishStatus);
  } else if (method === "disconnect") {
    Airfoil.disconnect(publishStatus);
  } else if (method === "status") {
    Airfoil.status(publishStatus);
  }
});

var zmq           = require("zmq");
var child_process = require("child_process");
var server_addr   = "tcp://127.0.0.1:12000";
var pub_addr      = "tcp://127.0.0.1:12002";
var server_sub    = zmq.socket("sub");
var pub           = zmq.socket("pub");

var volume = 20;

function shell_out(command, args, hollaback) {
  var child = child_process.spawn(command, args);
  var result = "";
  var error = ""
  child.stdout.on("data", function(chunk) {
    result += chunk.toString();
  });
  child.stderr.on("data", function(chunk) {
    error += chunk.toString();
  });
  child.on("exit", function(code) {
    if (error) {
      hollaback(error);
    } else {
      hollaback(null, result);
    }
  });
};

function publish_status(error, data) {
  if (!error) {
    var payload = [
      Spotbox.namespace("server"), // destination
      "status",                    // method
      data.volume,                 // volume
      data.status                  // status
    ].join("::");
    pub.send(payload);
  }
};

var Spotbox = function() {};
Spotbox.namespace = function(str) {
  return "spotbox:" + str;
};

Spotbox.parse_message = function(msg) {
  var full_message = msg.toString().split("::");
  return {
      destination : full_message[0]
    , method      : full_message[1]
    , args        : full_message.slice(2)
  }
};

var Airfoil = function() {};
Airfoil.status = function(hollaback) {
  shell_out("osascript", ["./airfoil_status.scpt"], function(error, result) {
    if (error) {
      hollaback(null, {volume: volume, status: "connected"});
    } else {
      if (result.trim() === "true") {
        hollaback(null, {volume: volume, status: "connected"});
      } else {
        hollaback(null, {volume: volume, status: "disconnected"});
      }
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

Airfoil.set_volume = function(hollaback) {
  shell_out("osascript", ["./airfoil_volume.scpt", volume / 100.0], function(error, result) {
    Airfoil.status(hollaback);
  });
}

pub.bindSync(pub_addr);
server_sub.connect(server_addr);
server_sub.subscribe(Spotbox.namespace("airfoil::"));
server_sub.on("message", function(msg) {
  var method = Spotbox.parse_message(msg).method;
  if (method === "volume_up") {
    volume += 5;
    Airfoil.set_volume(publish_status);
  } else if (method === "volume_down") {
    volume -= 5;
    Airfoil.set_volume(publish_status);
  } else if (method === "connect") {
    Airfoil.connect(publish_status);
  } else if (method === "disconnect") {
    Airfoil.disconnect(publish_status);
  } else if (method === "status") {
    Airfoil.status(publish_status);
  }
});

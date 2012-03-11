var path    = require("path");
var config  = require(path.join(__dirname, "..", "config"));
var Spotbox = require(path.join(config.root, "app", "lib", "spotbox"));
var Airfoil = require(path.join(config.root, "app", "lib", "airfoil"));

module.exports  = function() {
  config.airfoil_socket.on("message", function(msg) {
    var data = Spotbox.parse_message(msg);
    if (data.method === "status") {
      Airfoil.set_volume(data.args[0]);
      Airfoil.set_connection_status(data.args[1]);
    } else {
      console.log("unsupported message: ", msg.toString());
    }
  });
};

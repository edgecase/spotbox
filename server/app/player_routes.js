var path    = require("path");
var config  = require(path.join(__dirname, "..", "config"));
var Spotbox = require(path.join(config.root, "app", "lib", "spotbox"));
var Player  = require(path.join(config.root, "app", "lib", "player"));

module.exports  = function() {
  config.spotify_player_socket.on("message", function(msg) {

    var data = Spotbox.parse_message(msg);

    if (data.method === "playing") {
      Player.set_state("playing");
      Player.set_track(data.args[0]);
    } else if (data.method === "unpaused") {
      Player.set_state("playing");
    } else if (data.method === "stopped") {
      Player.set_state("stopped");
    } else if (data.method === "paused") {
      Player.set_state("paused");
    } else if (data.method === "track_progress") {
      Player.set_progress(data.args[0])
    } else if (data.method === "track_ended") {
      // not handled yet
    } else {
      console.log("unsupported message: ", msg.toString());
    }

  });
};

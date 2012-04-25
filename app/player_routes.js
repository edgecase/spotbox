var path    = require("path");
var config  = require(path.join(__dirname, "..", "config"));
var Spotbox = require(path.join(config.root, "app", "lib", "spotbox"));
var Player  = require(path.join(config.root, "app", "lib", "player"));
var PlaylistManager  = require(path.join(config.root, "app", "lib", "playlist_manager"));

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
    } else if (data.method === "trackProgress") {
      Player.set_state("playing");
      Player.set_progress(data.args[0])
      Player.set_track(data.args[1]);
    } else if (data.method === "trackEnded") {
      Player.play();
    } else if (data.method === "playlistLoaded") {

      var playlist_data = data.args[0].split(",");

      PlaylistManager.sync_playlist({
        id     : playlist_data[0],
        name   : playlist_data[1],
        tracks : playlist_data.slice(2)
      });

    } else {
      console.log("unsupported message: ", msg.toString());
    }

  });
};

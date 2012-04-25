Spotbox.Models.QueuedTrack = Spotbox.Models.Track.extend({
  eta: function() {
    var playState = Spotbox.Controllers.Player.get("playbackState");
    if (playState === "playing") {
      var queuedTracks = Spotbox.Controllers.QueuedTracks.get("content");
      var index = queuedTracks.indexOf(this);
      var currentTrack = Spotbox.Controllers.Player.get("content");
      var seconds = currentTrack.get("length") - currentTrack.get("progress");
      var i;
      for (i = 0; i < index; i++) {
        seconds += queuedTracks[i].get("length");
      }
      if (seconds < 60) {
        return "less than a minute";
      } else {
        return Math.round(seconds / 60) + " minutes";
      }
    } else {
      return "---";
    }
  }.property("Spotbox.Controllers.Player.content.progress", "Spotbox.Controllers.Player.playbackState")
});

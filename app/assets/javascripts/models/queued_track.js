Spotbox.QueuedTrack = Spotbox.Track.extend({
  eta: function() {
    var playState = Spotbox.router.getPath("playerController.playbackState");
    if (playState === "playing") {
      var queuedTracks = Spotbox.router.getPath("queuedTracksController.content");
      var index = queuedTracks.indexOf(this);
      var currentTrack = Spotbox.playerController.get("content");
      var seconds = currentTrack.get("length") - currentTrack.get("progress");
      var i;
      for (i = 0; i < index; i++) {
        seconds += parseInt(queuedTracks[i].get("length"), 10);
      }
      if (seconds < 60) {
        return "less than a minute";
      } else {
        return Math.round(seconds / 60) + " minutes";
      }
    } else {
      return "---";
    }
  }.property("Spotbox.playerController.content.progress", "Spotbox.playerController.playbackState")
});

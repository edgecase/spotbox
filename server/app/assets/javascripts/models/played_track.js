Spotbox.Models.PlayedTrack = Spotbox.Models.Track.extend({
  playedAgo: function() {
    var now = new Date();
    var date = new Date(this.get("created_at"));
    var minutes = Math.round((now - date) / (1000 * 60));
    if (minutes > 120) {
      return Math.round(minutes / 60) + " hours ago";
    } else {
      return minutes + " minutes ago";
    }
  }.property()
});

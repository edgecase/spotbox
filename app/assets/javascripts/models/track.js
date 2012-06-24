Spotbox.Track = Ember.Object.extend({
  progress: 0,

  percent: function() {
    return this.get("progress") / this.get("length") * 100;
  }.property("progress"),

  artistName: function() {
    var name = _.map(this.get('artists'), function(artist) {
      return artist.name;
    }).join(", ");
    return name;
  }.property("artists"),

  artistAndTrack: function() {
    return this.get("artistName") + " - " + this.get("name");
  }.property("artists", "name"),

  displayDuration: function() {
    var duration = this.get("length");
    var minutes  = Math.floor(duration / 60);
    var seconds  = Math.floor(duration % 60);
    if (seconds < 10) { seconds = "0" + seconds; }
    return minutes + ":" + seconds;
  }.property("length")
});

Spotbox.Track = Ember.Object.extend({
  progress: 0,

  percent: function() {
    return this.get("progress") / this.get("length") * 100;
  }.property("progress"),

  artistName: function() {
    var artist_name = _.map(this.get('artists'), function(artist) {
      return artist.name;
    }).join(", ");
    return artist_name;
  }.property("artists"),

  displayDuration: function() {
    var duration = this.get("length");
    var minutes  = Math.floor(duration / 60);
    var seconds  = Math.floor(duration % 60);
    if (seconds < 10) { seconds = "0" + seconds; }
    return minutes + ":" + seconds;
  }.property("length"),

  albumName: function() {
    return this.getPath("album.name");
  }.property("album"),

  releaseDate: function() {
    return this.getPath("album.released");
  }.property("album"),

  artistAndTrack: function() {
    return this.get("artistName") + " - " + this.get("name");
  }.property("artists", "name")
});

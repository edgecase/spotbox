Spotbox.Models.Track = Ember.Object.extend({
  artistName: function() {
    var artist_name = _.map(this.get('artists'), function(artist) {
      return artist.name;
    }).join(", ");
    return artist_name;
  }.property("artists"),

  displayDuration: function() {
    var duration = this.get("length");
    var minutes  = Math.floor(duration / 60);
    var seconds  = Math.floor(duration - minutes * 60);
    if (seconds < 10) { seconds = seconds + "0"; }
    return minutes + ":" + seconds;
  }.property("length"),

  albumName: function() {
    return this.get("album").name;
  }.property("album"),

  releaseDate: function() {
    return this.get("album").released;
  }.property("album")

});

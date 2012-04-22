Spotbox.Controllers.Stats = Ember.ArrayController.create({
  content: [],
  topPlayed: [],
  topArtists: [],
  topSkipped: [],

  init: function() {
    var self = this;
    Spotbox.socket.on("stats/top_played", function(tracks) {
      var models = _.map(tracks, function(track) {
        return Spotbox.Models.Track.create(track);
      });
      self.set("topPlayed", models);
    });
    Spotbox.socket.on("stats/top_artists", function(artists) {
      self.set("topArtists", artists);
    });
    Spotbox.socket.on("stats/top_skipped", function(tracks) {
      var models = _.map(tracks, function(track) {
        return Spotbox.Models.Track.create(track);
      });
      self.set("topSkipped", models);
    });
  }
});

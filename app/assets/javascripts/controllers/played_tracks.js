Spotbox.Controllers.PlayedTracks = Ember.ArrayController.create({
  content: [],
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/played", function(tracks) {
      tracks = _.map(tracks, function(track) {
        return Spotbox.Models.PlayedTrack.create(track);
      });
      self.set("content", tracks);
    });
  }
});

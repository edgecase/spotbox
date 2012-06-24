Spotbox.DislikesController = Ember.ArrayController.extend({
  content: [],
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/disliked", function(tracks) {
      var tracks = _.map(tracks, function(track) {
        return Spotbox.Track.create(track);
      });
      self.set("content", tracks);
    });
  }
});

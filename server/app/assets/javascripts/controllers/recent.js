Spotbox.Controllers.Recent = Ember.ArrayController.create({
  content: [],
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/recent", function(tracks) {
      var recent = _.map(tracks, function(track) {
        return Spotbox.Models.Track.create(track);
      });
      self.set("content", recent);
    });
  }
});

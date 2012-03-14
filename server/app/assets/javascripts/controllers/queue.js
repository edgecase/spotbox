Spotbox.Controllers.Queue = Ember.ArrayController.create({
  content: [],

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/queue", function(tracks) {
      var queue = _.map(tracks, function(track) {
        return Spotbox.Models.Track.create(track);
      });
      self.set("content", queue);
    });
  },

  enqueue: function(searchResult) {
    Spotbox.socket.emit("tracks/enqueue", searchResult.href);
  }
});

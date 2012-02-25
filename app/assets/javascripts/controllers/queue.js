Spotbox.Controllers.Queue = Ember.ArrayController.create({
  content: [],

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/queue", function(tracks) {
      self.set("content", tracks);
    });
  },

  enqueue: function(result) {
    Spotbox.socket.emit("tracks/enqueue", result.track.href);
  }
});

Spotbox.Controllers.Current = Ember.Object.create({
  content: null,

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/current", function(track) {
      self.set("content", track);
    });
  }
});

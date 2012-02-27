Spotbox.Controllers.Player = Ember.Object.create({
  content: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/current", function(track) {
      self.set("content", track);
    });
  },

  play: function() {
    Spotbox.socket.emit("player", "next");
  },

  stop: function() {
    Spotbox.socket.emit("player", "stop");
  },

  next: function() {
    Spotbox.socket.emit("player", "next");
  }
});

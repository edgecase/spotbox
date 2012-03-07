Spotbox.Controllers.Player = Ember.Object.create({
  content: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/current", function(track) {
      self.set("content", Spotbox.Models.Track.create(track));
    });

    Spotbox.socket.on("tracks/current/progress", function(data) {
      var track = self.get("content");
      track.set("progress", data.progress);
    });
  },

  play: function() {
    Spotbox.socket.emit("player", "play");
  },

  stop: function() {
    Spotbox.socket.emit("player", "stop");
    var track = this.get("content");
    track.set("progress", 0);
  },

  next: function() {
    Spotbox.socket.emit("player", "next");
  }
});

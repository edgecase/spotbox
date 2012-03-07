Spotbox.Controllers.Player = Ember.Object.create({
  content: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/current", function(track) {
      console.log(track);
      self.set("content", track);
    });

    Spotbox.socket.on("tracks/current/progress", function(data) {
      var content = self.get("content");
      var length = content.track.length;
      var percent = data.progress / length * 100;
      self.set("precent", precent);
    });
  },

  play: function() {
    Spotbox.socket.emit("player", "play");
  },

  stop: function() {
    Spotbox.socket.emit("player", "stop");
  },

  next: function() {
    Spotbox.socket.emit("player", "next");
  }
});

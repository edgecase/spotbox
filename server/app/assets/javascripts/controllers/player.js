Spotbox.Controllers.Player = Ember.Object.create({
  content: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("player/track", function(track) {
      self.set("content", Spotbox.Models.Track.create(track));
    });

    Spotbox.socket.on("player/progress", function(data) {
      var track = self.get("content");
      if (track) {
        track.set("progress", data.progress);
      } else {
        console.log("no track");
      }
    });
  },

  play: function() {
    Spotbox.socket.emit("player", "play");
  },

  pause: function() {
    Spotbox.socket.emit("player", "pause");
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

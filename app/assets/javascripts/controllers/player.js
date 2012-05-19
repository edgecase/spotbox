Spotbox.Controllers.Player = Ember.Object.create({
  playbackState: null,

  content: Spotbox.Models.Track.create({
    name: "Nothing Playing",
    length: 0.00,
    album: { name: "Challet", released: "2005" },
    artists: [{name: "EdgeCase"}]
  }),

  init: function() {
    var self = this;

    Spotbox.socket.on("player/state", function(state) {
      self.set("playbackState", state);
    });

    Spotbox.socket.on("player/track", function(track) {
      if (track) {
        self.set("content", Spotbox.Models.Track.create(track));
      }
    });

    Spotbox.socket.on("player/progress", function(progress) {
      var track = self.get("content");
      if (track) {
        track.set("progress", progress);
      }
    });
  },

  play: function() {
    Spotbox.socket.emit("player/command", "play");
  },

  pause: function() {
    Spotbox.socket.emit("player/command", "pause");
  },

  next: function() {
    Spotbox.socket.emit("player/command", "next");
  }
});

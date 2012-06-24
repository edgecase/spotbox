Spotbox.PlayerController = Ember.Controller.extend({
  playbackState: null,

  content: Spotbox.Track.create({
    name: "Nothing Playing",
    length: 0.00,
    album: { name: "Chalet", released: "2005" },
    artists: [{name: "EdgeCase"}]
  }),

  init: function() {
    var self = this;

    Spotbox.socket.on("player/state", function(state) {
      self.set("playbackState", state);
    });

    Spotbox.socket.on("player/track", function(track) {
      if (track) {
        self.set("content", Spotbox.Track.create(track));
        document.title = track.name + " - " + _.pluck(track.artists, "name").join(",");
      }
    });

    Spotbox.socket.on("player/progress", function(progress) {
      var track = self.get("content");
      if (track) {
        track.set("progress", progress);
      }
    });
  },

  unpause: function() {
    Spotbox.socket.emit("player/command", "unpause");
  },

  pause: function() {
    Spotbox.socket.emit("player/command", "pause");
  },

  thumbsUp: function(track) {
    Spotbox.socket.emit("tracks/rating", track, "up");
  },

  thumbsDown: function(track) {
    Spotbox.socket.emit("tracks/rating", track, "down");
  }
});

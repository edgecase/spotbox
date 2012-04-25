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

    Spotbox.socket.on("player/state", function(data) {
      self.set("playbackState", data.state);
    });

    Spotbox.socket.on("player/track", function(data) {
      self.set("content", Spotbox.Models.Track.create(data.track));
      $("title").text(self.get("content").get("artistAndTrack"));
    });

    Spotbox.socket.on("player/next_votes", function(data) {
      self.set("nextVotes", data);
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

  next: function() {
    Spotbox.socket.emit("player", "next");
  }
});

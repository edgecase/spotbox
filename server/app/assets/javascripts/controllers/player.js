Spotbox.Controllers.Player = Ember.Object.create({
  playbackState: "stopped",

  content: Spotbox.Models.Track.create({
    name: "Nothing Playing",
    length: 0.00,
    album: { name: "Challet", released: "2005" },
    artists: [{name:"EdgeCase"}]
  }),

  init: function() {
    var self = this;

    Spotbox.socket.on("player/state", function(data) {
      console.log(data);
      self.set("playbackState", data.state);
    });

    Spotbox.socket.on("player/track", function(data) {
      self.set("content", Spotbox.Models.Track.create(data.track));
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

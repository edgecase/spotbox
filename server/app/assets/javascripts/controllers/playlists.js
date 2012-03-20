Spotbox.Controllers.Playlists = Ember.ArrayController.create({
  content: [],
  prefix: '',

  init: function() {
    var self = this;
    Spotbox.socket.on("playlists", function(playlists) {
      self.set("content", playlists);
    });
    Spotbox.socket.on("playlists/current", function(uri) {
      self.set("currentUri", uri);
    });
  },

  changePlaylist: function(uri) {
    if (this.get("currentUri") !== uri) {
      this.set("currentUri", uri);
      Spotbox.socket.emit("playlists/set", uri);
    }
  }
});

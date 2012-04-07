Spotbox.Controllers.Playlists = Ember.ArrayController.create({
  content: [],
  prefix: '',

  init: function() {
    var self = this;
    Spotbox.socket.on("playlists", function(playlists) {
      self.set("content", playlists);
    });
    Spotbox.socket.on("playlists/current", function(id) {
      self.set("currentId", id);
    });
  },

  changePlaylist: function(id) {
    if (this.get("currentId") !== id) {
      this.set("currentId", id);
      Spotbox.socket.emit("playlists/set", id);
    }
  },

  currentPlaylistName: function() {
    var self = this;
    var current_playlist = _.find(self.get("content"), function(playlist) {
      return playlist.id === self.get("currentId");
    });
    return "playing " + (current_playlist ? current_playlist.name : "[No Playlist]");
  }.property("content", "currentId")

});

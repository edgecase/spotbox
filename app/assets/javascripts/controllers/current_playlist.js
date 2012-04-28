Spotbox.Controllers.CurrentPlaylist = Ember.ArrayController.create({
  content: [],

  init: function() {
    var self = this;
    Spotbox.socket.on("playlists/current/tracks", function(tracks) {
      var playlist = _.map(tracks, function(track) {
        return Spotbox.Models.Track.create(track);
      });
      self.set("content", playlist);
    });
  },

  enqueue: function(track) {
    Spotbox.socket.emit("tracks/enqueue", track.id);
  }
});

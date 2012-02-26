Spotbox.Controllers.Recent = Ember.ArrayController.create({
  content: [],
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/recent", function(tracks) {
      self.set("content", tracks);
    });
  }
});

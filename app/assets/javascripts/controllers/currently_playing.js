Spotbox.Controllers.CurrentlyPlaying = Ember.Object.create({
  content: null,

  init: function() {
    var self = this;
    Spotbox.socket.on('change-current', function(track) {
      console.log("change-current event! ", track);
      self.set('content', track);
    });
  }

});

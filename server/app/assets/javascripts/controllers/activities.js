Spotbox.Controllers.Activities = Ember.ArrayController.create({
  content: [],
  init: function() {
    var self = this;
    Spotbox.socket.on("activities", function(message) {
      message.time = new Date(message.time);
      self.pushObject(message);
    });
  }
});

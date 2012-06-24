Spotbox.MessagesController = Ember.ArrayController.extend({
  content: [],
  init: function() {
    Spotbox.socket.on("messages/success", function(title, text) {
      Spotbox.successMessage(title, text);
    });
    Spotbox.socket.on("messages/error", function(title, text) {
      if (typeof title === "object") {
        Spotbox.errorMessage(title.error, title.message);
      } else {
        Spotbox.errorMessage(title, text);
      }
    });
  }
});

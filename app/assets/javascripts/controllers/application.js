Spotbox.ApplicationController = Ember.Controller.extend({
  version: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("spotbox/version", function(version) {
      self.set("version", version);
    });
    Spotbox.socket.on("reload", function(user) {
      window.location.reload();
    });
  }
});

Spotbox.Controllers.Application = Ember.Object.create({
  version: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("spotbox/version", function(version) {
      var oldVersion = self.get("version");
      if (oldVersion && oldVersion !== version) {
        window.location.reload();
      } else {
        self.set("version", version);
      }
    });
    Spotbox.socket.on("error", function(msg) {
      Spotbox.errorMessage(msg.error, msg.message);
    });
    Spotbox.socket.on("authenticate", function() {
      page("/auth/google");
    });
  }
});

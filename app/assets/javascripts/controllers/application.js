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
  }
});

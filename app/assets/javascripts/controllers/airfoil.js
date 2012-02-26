Spotbox.Controllers.Airfoil = Ember.Object.create({
  init: function() {
    var self = this;
    Spotbox.socket.on("airfoil", function(message) {
      self.set("status", message);
    });
  },
  toggleConnection: function() {
    if (this.get("status") === "connected") {
      Spotbox.socket.emit("airfoil", "disconnect");
      this.set("status", "disconnected");
    } else {
      Spotbox.socket.emit("airfoil", "connect");
      this.set("status", "connected");
    }
  },
});

Spotbox.Controllers.Airfoil = Ember.Object.create({
  init: function() {
    var self = this;
    Spotbox.socket.on("airfoil", function(message) {
      self.set("status", message);
    });
  },
  connect: function() {
    if (this.get("status") !== "connected") {
      Spotbox.socket.emit("airfoil", "connect");
      this.set("status", "connected");
    }
  },
  disconnect: function() {
    if (this.get("status") !== "disconnected") {
      Spotbox.socket.emit("airfoil", "disconnect");
      this.set("status", "disconnected");
    }
  },
});

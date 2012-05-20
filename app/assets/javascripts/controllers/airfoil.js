Spotbox.Controllers.Airfoil = Ember.Object.create({
  volume: 0,
  connection: "disconnected",
  init: function() {
    var self = this;
    Spotbox.socket.on("airfoil", function(message) {
      self.set("connection", message.connection);
      self.set("volume", message.volume);
    });
  },

  toggleConnection: function() {
    // Immediate feedback
    if (this.get("connection")) {
      Spotbox.socket.emit("airfoil", "disconnect");
      this.set("connection", false);
    } else {
      Spotbox.socket.emit("airfoil", "connect");
      this.set("connection", true);
    }
  },

  volumeUp: function() {
    // Immediate feedback
    volume = this.get("volume");
    volume += 5;
    this.set("volume", volume);
    Spotbox.socket.emit("airfoil", "volumeUp");
  },

  volumeDown: function() {
    // Immediate feedback
    volume = this.get("volume");
    volume -= 5;
    this.set("volume", volume);
    Spotbox.socket.emit("airfoil", "volumeDown");
  }
});

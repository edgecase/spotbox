Spotbox.Controllers.Airfoil = Ember.Object.create({
  volume: 0,
  status: "disconnected",
  init: function() {
    var self = this;
    Spotbox.socket.on("airfoil", function(message) {
      self.set("status", message.status);
      self.set("volume", message.volume);
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

  volumeUp: function() {
    Spotbox.socket.emit("airfoil", "volumeUp");
    volume = this.get("volume");
    if (volume < 100) {
      volume += 5;
    }
    this.set("volume", volume);
  },

  volumeDown: function() {
    Spotbox.socket.emit("airfoil", "volumeDown");
    volume = this.get("volume");
    if (volume > 0) {
      volume -= 5;
    }
    this.set("volume", volume);
  }
});

Spotbox.Controllers.Airfoil = Ember.Object.create({
  volume: 0,
  connectionStatus: "disconnected",
  init: function() {
    var self = this;
    Spotbox.socket.on("airfoil", function(message) {
      self.set("connectionStatus", message.connection_status);
      self.set("volume", message.volume);
    });
  },

  toggleConnection: function() {
    if (this.get("connectionStatus") === "connected") {
      Spotbox.socket.emit("airfoil", "disconnect");
      this.set("connectionStatus", "disconnected");
    } else {
      Spotbox.socket.emit("airfoil", "connect");
      this.set("connectionStatus", "connected");
    }
  },

  volumeUp: function() {
    Spotbox.socket.emit("airfoil", "volume_up");
    volume = this.get("volume");
    if (volume < 100) {
      volume += 5;
    }
    this.set("volume", volume);
  },

  volumeDown: function() {
    Spotbox.socket.emit("airfoil", "volume_down");
    volume = this.get("volume");
    if (volume > 0) {
      volume -= 5;
    }
    this.set("volume", volume);
  }
});

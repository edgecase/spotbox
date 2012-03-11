Spotbox.Controllers.Airfoil = Ember.Object.create({
  volume: 0,
  connection_status: "disconnected",
  init: function() {
    var self = this;
    Spotbox.socket.on("airfoil", function(message) {
      self.set("connection_status", message.connection_status);
      self.set("volume", message.volume);
    });
  },

  toggle_connection: function() {
    if (this.get("connection_status") === "connected") {
      Spotbox.socket.emit("airfoil", "disconnect");
      this.set("connection_status", "disconnected");
    } else {
      Spotbox.socket.emit("airfoil", "connect");
      this.set("connection_status", "connected");
    }
  },

  volume_up: function() {
    Spotbox.socket.emit("airfoil", "volume_up");
    volume = this.get("volume");
    if (volume < 100) {
      volume += 5;
    }
    this.set("volume", volume);
  },

  volume_down: function() {
    Spotbox.socket.emit("airfoil", "volume_down");
    volume = this.get("volume");
    if (volume > 0) {
      volume -= 5;
    }
    this.set("volume", volume);
  }
});

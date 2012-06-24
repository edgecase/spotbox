Spotbox.AirfoilController = Ember.Controller.extend({
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
    if (this.get("connection")) {
      Spotbox.socket.emit("airfoil", "disconnect");
    } else {
      Spotbox.socket.emit("airfoil", "connect");
    }
  },

  volumeUp: function() {
    Spotbox.socket.emit("airfoil", "volumeUp");
  },

  volumeDown: function() {
    Spotbox.socket.emit("airfoil", "volumeDown");
  }
});

Spotbox.Views.Airfoil = Ember.View.extend({
  templateName: "airfoil",
  connectionStatusBinding: "Spotbox.Controllers.Airfoil.connectionStatus",
  volumeBinding: "Spotbox.Controllers.Airfoil.volume",
  toggleButton: Spotbox.Views.Button.extend({
    activeBinding: "connected",
    classNameBindings: ["disconnected:btn-danger", "connected:btn-success"],
    click: function(event) {
      Spotbox.Controllers.Airfoil.toggle_connection();
    },
    connectionStatusUpdate: function() {
      if (this.getPath("parentView.connectionStatus") === "connected") {
        this.set("connected", true);
        this.set("disconnected", false);
      } else {
        this.set("connected", false);
        this.set("disconnected", true);
      }
    }.observes("parentView.connectionStatus")
  }),
  volumeUp: function() {
    Spotbox.Controllers.Airfoil.volumeUp();
  },
  volumeDown: function() {
    Spotbox.Controllers.Airfoil.volumeDown();
  }
});

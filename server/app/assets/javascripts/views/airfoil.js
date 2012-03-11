Spotbox.Views.Airfoil = Ember.View.extend({
  templateName: "airfoil",
  connection_statusBinding: "Spotbox.Controllers.Airfoil.connection_status",
  volumeBinding: "Spotbox.Controllers.Airfoil.volume",
  toggleButton: Spotbox.Views.Button.extend({
    activeBinding: "connected",
    classNameBindings: ["disconnected:btn-danger", "connected:btn-success"],
    click: function(event) {
      Spotbox.Controllers.Airfoil.toggle_connection();
    },
    connection_status_update: function() {
      if (this.getPath("parentView.connection_status") === "connected") {
        this.set("connected", true);
        this.set("disconnected", false);
      } else {
        this.set("connected", false);
        this.set("disconnected", true);
      }
    }.observes("parentView.connection_status")
  }),
  volume_up: function() {
    Spotbox.Controllers.Airfoil.volume_up();
  },
  volume_down: function() {
    Spotbox.Controllers.Airfoil.volume_down();
  }
});

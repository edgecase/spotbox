Spotbox.Views.Airfoil = Ember.View.extend({
  templateName: "airfoil",
  statusBinding: "Spotbox.Controllers.Airfoil.status",
  volumeBinding: "Spotbox.Controllers.Airfoil.volume",
  toggleButton: Spotbox.Views.Button.extend({
    activeBinding: "connected",
    classNameBindings: ["disconnected:btn-danger", "connected:btn-success"],
    click: function(event) {
      Spotbox.Controllers.Airfoil.toggleConnection();
    },
    statusUpdate: function() {
      if (this.getPath("parentView.status") === "connected") {
        this.set("connected", true);
        this.set("disconnected", false);
      } else {
        this.set("connected", false);
        this.set("disconnected", true);
      }
    }.observes("parentView.status")
  }),
  volumeUp: function() {
    Spotbox.Controllers.Airfoil.volumeUp();
  },
  volumeDown: function() {
    Spotbox.Controllers.Airfoil.volumeDown();
  }
});
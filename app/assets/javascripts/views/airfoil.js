Spotbox.Views.Airfoil = Ember.View.extend({
  templateName: "airfoil",
  statusBinding: "Spotbox.Controllers.Airfoil.status",
  connectButton: Spotbox.Views.Button.extend({
    classNameBindings: ["disconnected:btn-success"],
    click: function(event) {
      Spotbox.Controllers.Airfoil.connect();
    },
    text: function() {
      if (this.getPath("parentView.status") === "connected") {
        return "Connected";
      } else {
        return "Connect";
      }
    }.property("parentView.status"),
    statusUpdate: function() {
      if (this.getPath("parentView.status") === "disconnected") {
        this.set("disconnected", true);
        this.set("active", false)
      } else {
        this.set("disconnected", false);
        this.set("active", true)
      }
    }.observes("parentView.status")
  }),
  disconnectButton: Spotbox.Views.Button.extend({
    classNameBindings: ["connected:btn-danger"],
    click: function(event) {
      Spotbox.Controllers.Airfoil.disconnect();
    },
    text: function() {
      if (this.getPath("parentView.status") === "disconnected") {
        return "Disconnected";
      } else {
        return "Disconnect";
      }
    }.property("parentView.status"),
    statusUpdate: function() {
      if (this.getPath("parentView.status") === "connected") {
        this.set("connected", true);
        this.set("active", false)
      } else {
        this.set("connected", false);
        this.set("active", true)
      }
    }.observes("parentView.status")
  })
});

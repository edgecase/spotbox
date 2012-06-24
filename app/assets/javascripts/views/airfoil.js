Spotbox.AirfoilView = Ember.View.extend({
  templateName: "airfoil",
  connectionBinding: "Spotbox.airfoilController.connection",
  volumeBinding: "Spotbox.airfoilController.volume",
  toggleButton: Ember.View.extend({
    tagName: "a",
    activeBinding: "parentView.connection",
    classNames: "btn",
    classNameBindings: ["disconnected:btn-danger", "connected:btn-success"],
    click: function(event) {
      Spotbox.airfoilController.toggleConnection();
    },
    connectionStatusText: function() {
      return this.getPath("parentView.connection") === true ? "connected" : "disconnected";
    }.property("parentView.connection"),
    connected: function() {
      return this.getPath("parentView.connection");
    }.property("parentView.connection"),
    disconnected: function() {
      return !this.getPath("parentView.connection");
    }.property("parentView.connection")
  }),
  volumeUp: function() {
    Spotbox.airfoilController.volumeUp();
  },
  volumeDown: function() {
    Spotbox.airfoilController.volumeDown();
  }
});

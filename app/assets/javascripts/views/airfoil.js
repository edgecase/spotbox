Spotbox.Views.Airfoil = Ember.View.extend({
  templateName: "airfoil",
  connectionBinding: "Spotbox.Controllers.Airfoil.connection",
  volumeBinding: "Spotbox.Controllers.Airfoil.volume",
  toggleButton: Ember.View.extend({
    tagName: "a",
    activeBinding: "parentView.connection",
    classNames: "btn",
    classNameBindings: ["disconnected:btn-danger", "connected:btn-success"],
    click: function(event) {
      Spotbox.Controllers.Airfoil.toggleConnection();
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
    Spotbox.Controllers.Airfoil.volumeUp();
  },
  volumeDown: function() {
    Spotbox.Controllers.Airfoil.volumeDown();
  }
});

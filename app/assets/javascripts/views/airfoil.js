Spotbox.AirfoilView = Ember.View.extend({
  templateName: "airfoil",
  connectionBinding: "controller.connection",
  volumeBinding: "controller.volume",
  toggleButton: Ember.View.extend({
    tagName: "a",
    activeBinding: "parentView.connection",
    classNames: "btn",
    classNameBindings: ["disconnected:btn-danger", "connected:btn-success"],
    click: function(event) {
      this.getPath("parentView.controller").toggleConnection();
    },
    connectionStatusText: function() {
      var text = "connected";
      var connection = this.getPath("parentView.connection");
      if (connection === false) text = "disconnected";
      return text;
    }.property("parentView.connection"),
    connected: function() {
      return this.getPath("parentView.connection");
    }.property("parentView.connection"),
    disconnected: function() {
      return !this.getPath("parentView.connection");
    }.property("parentView.connection")
  }),
  volumeUp: function() {
    this.get("controller").volumeUp();
  },
  volumeDown: function() {
    this.get("controller").volumeDown();
  }
});

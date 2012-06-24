Spotbox.HeaderView = Ember.View.extend({
  templateName: "header",
  classNames: ["navbar", "navbar-fixed-top"],
  versionBinding: "Spotbox.applicationController.version",
  userBinding: "Spotbox.applicationController.user",
  authenticate: function(event) {
    event.preventDefault();
    if (this.get("authentication")) {
      Spotbox.successMessage("Authentication", "Already authenticated");
    } else {
      window.location = "/auth/google";
    }
  }
});

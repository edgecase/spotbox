Spotbox.Views.Header = Ember.View.extend({
  templateName: "header",
  classNames: ["navbar", "navbar-fixed-top"],
  versionBinding: "Spotbox.Controllers.Application.version",
  userBinding: "Spotbox.Controllers.Application.user",
  authenticate: function(event) {
    event.preventDefault();
    if (this.get("authentication")) {
      Spotbox.successMessage("Authentication", "Already authenticated");
    } else {
      page("/auth/google");
    }
  }
});

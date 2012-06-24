Spotbox.HeaderView = Ember.View.extend({
  templateName: "header",
  classNames: ["navbar", "navbar-fixed-top"],
  versionBinding: "Spotbox.router.applicationController.version"
});

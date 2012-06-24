Spotbox.AlertView = Ember.View.extend({
  templateName: "alert",
  classNames: ["alert"],
  classNameBindings: ["alertError", "alertSuccess", "alertInfo"]
});

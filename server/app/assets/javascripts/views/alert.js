Spotbox.Views.Alert = Ember.View.extend({
  templateName: "alert",
  classNames: ["alert"],
  modelBinding: "Spotbox.Controllers.Alert.content",
  classNameBindings: ["alertError", "alertSuccess", "alertInfo"],

  isVisible: function() {
    return !_.isNull(this.get("model"));
  }.property("model"),

  alertError: function() {
    return this.getPath("model.level") === "error";
  }.property("model"),

  alertSuccess: function() {
    return this.getPath("model.level") === "success";
  }.property("model"),

  alertInfo: function() {
    return this.getPath("model.level") === "info";
  }.property("model")

});

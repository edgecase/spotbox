Spotbox.Views.CurrentTrack = Ember.View.extend({
  templateName: "current",
  classNames: ["current_track"],
  modelBinding: "Spotbox.Controllers.Player.content",
  style: function() {
    return "width: " + this.getPath("model.percent") + "%;";
  }.property("model.percent")
});

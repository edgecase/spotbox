Spotbox.Views.CurrentTrack = Ember.View.extend({
  templateName: "current",
  classNames: ["current_track"],
  modelBinding: "Spotbox.Controllers.Player.content"
});

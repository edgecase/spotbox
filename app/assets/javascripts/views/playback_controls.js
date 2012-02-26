Spotbox.Views.PlaybackControls = Ember.View.extend({
  templateName: "playback_controls",
  playButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Current.play();
    }
  }),
  stopButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Current.stop();
    }
  }),
  nextButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Current.next();
    }
  })
});

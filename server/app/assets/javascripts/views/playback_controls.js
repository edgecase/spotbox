Spotbox.Views.PlaybackControls = Ember.View.extend({
  templateName: "playback_controls",
  playButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Player.play();
    }
  }),
  stopButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Player.stop();
    }
  }),
  nextButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Player.next();
    }
  }),
  pauseButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Player.pause();
    }
  })
});

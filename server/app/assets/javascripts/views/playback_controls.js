Spotbox.Views.PlaybackControls = Ember.View.extend({
  templateName: "playback_controls",
  classNames: ["well"],

  trackInfo: Ember.View.extend({
    classNames: ["well"],

    modelBinding: "Spotbox.Controllers.Player.content",
  }),

  playbackControl: Ember.View.extend({
    tagName: "a",
    classNames: ["btn", "btn-large"],
    playbackIcon: "icon-play",

    click: function(event) {
      event.preventDefault();
      Spotbox.Controllers.Player.togglePlayback();
      if (Spotbox.Controllers.Player.playing) {
        Spotbox.Controllers.Player.play();
      } else {
        Spotbox.Controllers.Player.pause();
      }
    },

    setPlaybackIcon: function() {
      if (Spotbox.Controllers.Player.playing === true) {
        this.set("playbackIcon", "icon-pause");
      } else {
        this.set("playbackIcon", "icon-play");
      }
    }.observes("Spotbox.Controllers.Player.playing")
  }),

  playbackProgress: Ember.View.extend({
    classNames: ["progress", "progress-success"],
  }),

  nextTrackControl: Ember.View.extend({
    tagName: "a",
    classNames: ["btn", "btn-mini"],

    click: function(event) {
      Spotbox.Controllers.Player.next();
    }
  }),
});

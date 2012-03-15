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
      var playbackState = Spotbox.Controllers.Player.playbackState;

      if (playbackState === "stopped") {
        Spotbox.Controllers.Player.play();
        Spotbox.Controllers.Player.set("playbackState", "playing");
      } else if (playbackState === "paused") {
        Spotbox.Controllers.Player.unpause();
        Spotbox.Controllers.Player.set("playbackState", "playing");
      } else if (playbackState === "playing") {
        Spotbox.Controllers.Player.pause();
        Spotbox.Controllers.Player.set("playbackState", "paused");
      }
    },

    setPlaybackIcon: function() {
      var playbackState = Spotbox.Controllers.Player.playbackState;

      if (playbackState === "stopped" || playbackState === "paused") {
        this.set("playbackIcon", "icon-play");
      } else if (playbackState === "playing") {
        this.set("playbackIcon", "icon-pause");
      }
    }.observes("Spotbox.Controllers.Player.playbackState")
  }),

  playbackProgress: Ember.View.extend({
    classNames: ["progress", "progress-success"],
    modelBinding: "Spotbox.Controllers.Player.content",

    style: function() {
      return "width: " + this.getPath("model.percent") + "%;";
    }.property("model.percent")
  }),

  nextTrackControl: Ember.View.extend({
    tagName: "a",
    classNames: ["btn", "btn-mini"],

    click: function(event) {
      Spotbox.Controllers.Player.next();
    }
  }),
});

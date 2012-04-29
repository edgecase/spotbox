Spotbox.Views.PlaybackControls = Ember.View.extend({
  templateName: "playback_controls",
  classNames: ["well"],
  modelBinding: "Spotbox.Controllers.Player.content",

  someDontLike: function() {
    return Spotbox.Controllers.Player.disapprovalPercentage >= 0.25;
  }.property("Spotbox.Controllers.Player.disapprovalPercentage"),

  halfDontLike: function() {
    return Spotbox.Controllers.Player.disapprovalPercentage >= 0.50;
  }.property("Spotbox.Controllers.Player.disapprovalPercentage"),

  mostDontLike: function() {
    return Spotbox.Controllers.Player.disapprovalPercentage >= 0.75;
  }.property("Spotbox.Controllers.Player.disapprovalPercentage"),

  playbackControl: Ember.View.extend({
    tagName: "a",
    classNames: ["btn", "btn-large"],
    playbackIcon: "icon-play",

    click: function(event) {
      event.preventDefault();
      var playbackState = Spotbox.Controllers.Player.playbackState;

      if (playbackState === "stopped") {
        Spotbox.Controllers.Player.play();
      } else if (playbackState === "paused") {
        Spotbox.Controllers.Player.play();
      } else if (playbackState === "playing") {
        Spotbox.Controllers.Player.pause();
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

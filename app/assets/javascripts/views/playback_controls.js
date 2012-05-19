Spotbox.Views.PlaybackControls = Ember.View.extend({
  templateName: "playback_controls",
  classNames: ["well"],
  modelBinding: "Spotbox.Controllers.Player.content",

  smallAlbumArtUrl: function() {
    var currentTrack = Spotbox.Controllers.Player.content;
    var artwork      = currentTrack.getPath("album.artwork")
    return artwork && artwork[1]["#text"] || "/images/missing_album_art.jpg";
  }.property("Spotbox.Controllers.Player.content.album.artwork"),

  itunesLink: function() {
    var artist = Spotbox.Controllers.Player.content.get("artistName");
    var track  = Spotbox.Controllers.Player.content.get("name");
    return "http://itunes.com/" + Spotbox.itunesParam(artist) + "/" + Spotbox.itunesParam(track);
  }.property("Spotbox.Controllers.Player.content"),

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
      var playbackState = Spotbox.Controllers.Player.get("playbackState");

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

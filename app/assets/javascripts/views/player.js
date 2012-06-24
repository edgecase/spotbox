Spotbox.PlayerView = Ember.View.extend({
  templateName: "player",
  classNames: ["player", "well"],
  classNameBindings: ["draghover"],

  didInsertElement: function() {
    var self = this;
    this.$().on("dragover", function() {
      self.set("draghover", true);
    });
    this.$().on("dragleave", function() {
      self.set("draghover", false);
    });
  },

  drop: function(event) {
    this.set("draghover", false);
    _.each(event.originalEvent.dataTransfer.files, function(file) {
      Spotbox.router.uploadsController.upload(file);
    });
  },

  thumbsUp: function() {
    var track = this.getPath("controller.content");
    Spotbox.router.playerController.thumbsUp(track);
  },

  thumbsDown: function() {
    var track = this.getPath("controller.content");
    Spotbox.router.playerController.thumbsDown(track);
  },

  smallAlbumArtUrl: function() {
    var artwork = this.getPath("controller.content.album.artwork");
    return artwork && artwork[1]["#text"] || "/images/missing_album_art.jpg";
  }.property("controller.content.album.artwork"),

  itunesLink: function() {
    var track = this.getPath("controller.content");
    var artist = track.get("artistName");
    var track  = track.get("name");
    return "http://itunes.com/" + Spotbox.itunesParam(artist) + "/" + Spotbox.itunesParam(track);
  }.property("controller.content"),

  playbackControl: Ember.View.extend({
    tagName: "a",
    classNames: ["btn", "btn-large"],
    playbackIcon: "icon-play",
    playbackStateBinding: "parentView.controller.playbackState",

    click: function(event) {
      var playbackState = this.get("playbackState");

      if (playbackState === "stopped") {
        Spotbox.router.playerController.unpause();
      } else if (playbackState === "paused") {
        Spotbox.router.playerController.unpause();
      } else if (playbackState === "playing") {
        Spotbox.router.playerController.pause();
      }
    },

    setPlaybackIcon: function() {
      var playbackState = this.get("playbackState");

      if (playbackState === "stopped" || playbackState === "paused") {
        this.set("playbackIcon", "icon-play");
      } else if (playbackState === "playing") {
        this.set("playbackIcon", "icon-pause");
      }
    }.observes("playbackState")
  }),

  playbackProgress: Ember.View.extend({
    classNames: ["progress", "progress-success"],
    contentBinding: "parentView.controller.content",
    style: function() {
      return "width: " + this.getPath("content.percent") + "%;";
    }.property("content.percent")
  }),

  fromPlaylist: function() {
    return !this.getPath("controller.content.queue");
  }.property("controller.content"),

  requestedBy: function() {
    return this.getPath("controller.content.meta.user.name");
  }.property("controller.content")
});

Spotbox.PlayerView = Ember.View.extend({
  templateName: "player",
  classNames: ["player", "well"],
  classNameBindings: ["draghover"],
  modelBinding: "Spotbox.router.playerController.content",

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
      Spotbox.router.get("uploadsController").upload(file);
    });
  },

  thumbsUp: function() {
    var track = Spotbox.router.getPath("playerController.content");
    Spotbox.router.get("playerController").thumbsUp(track);
  },

  thumbsDown: function() {
    var track = Spotbox.router.getPath("playerController.content");
    Spotbox.router.get("playerController").thumbsDown(track);
  },

  smallAlbumArtUrl: function() {
    var currentTrack = Spotbox.router.getPath("playerController.content");
    var artwork      = currentTrack.getPath("album.artwork")
    return artwork && artwork[1]["#text"] || "/images/missing_album_art.jpg";
  }.property("Spotbox.router.playerController.content.album.artwork"),

  itunesLink: function() {
    var track = Spotbox.router.getPath("playerController.content");
    var artist = track.getPath("artistName");
    var track  = track.getPath("name");
    return "http://itunes.com/" + Spotbox.itunesParam(artist) + "/" + Spotbox.itunesParam(track);
  }.property("Spotbox.router.playerController.content"),

  playbackControl: Ember.View.extend({
    tagName: "a",
    classNames: ["btn", "btn-large"],
    playbackIcon: "icon-play",

    click: function(event) {
      event.preventDefault();
      var playbackState = Spotbox.router.getPath("playerController.playbackState");

      if (playbackState === "stopped") {
        Spotbox.playerController.unpause();
      } else if (playbackState === "paused") {
        Spotbox.playerController.unpause();
      } else if (playbackState === "playing") {
        Spotbox.playerController.pause();
      }
    },

    setPlaybackIcon: function() {
      var playbackState = Spotbox.router.getPath("playerController.playbackState");

      if (playbackState === "stopped" || playbackState === "paused") {
        this.set("playbackIcon", "icon-play");
      } else if (playbackState === "playing") {
        this.set("playbackIcon", "icon-pause");
      }
    }.observes("Spotbox.router.playerController.playbackState")
  }),

  playbackProgress: Ember.View.extend({
    classNames: ["progress", "progress-success"],
    modelBinding: "Spotbox.router.playerController.content",

    style: function() {
      return "width: " + this.getPath("model.percent") + "%;";
    }.property("model.percent")
  }),

  fromPlaylist: function() {
    return !this.getPath("model.queue");
  }.property("model"),

  requestedBy: function() {
    return this.getPath("model.meta.user.name");
  }.property("model")
});

Spotbox.Views.Playlist = Ember.View.extend({
  templateName: "playlist",
  tagName: "li",
  currentUriBinding: "Spotbox.Controllers.Playlists.currentUri",
  didInsertElement: function() {
    this.setActive();
  },
  click: function(event) {
    Spotbox.Controllers.Playlists.changePlaylist(this.get("model").href);
  },
  setActive: function() {
    var active = this.get("model").href === this.get("currentUri");
    this.set("active", active);
    this.set("label", active);
  }.observes("currentUri")
});

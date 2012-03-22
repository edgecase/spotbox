Spotbox.Views.Playlist = Ember.View.extend({
  templateName: "playlist",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list", "tab-pane"],
  // currentUriBinding: "Spotbox.Controllers.Playlists.currentUri",
  // didInsertElement: function() {
  //   this.setActive();
  // },
  // click: function(event) {
  //   Spotbox.Controllers.Playlists.changePlaylist(this.get("model").href);
  // },
  // setActive: function() {
  //   var active = this.get("model").href === this.get("currentUri");
  //   this.set("active", active);
  //   this.set("label", active);
  // }.observes("currentUri")
});

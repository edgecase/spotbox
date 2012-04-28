Spotbox.Views.Playlist = Ember.View.extend({
  templateName: "playlist",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list"],
  contentBinding: "Spotbox.Controllers.CurrentPlaylist.content",

  showContent: function() {
    return this.get("content").length > 0;
  }.property("content")
});

Spotbox.Views.Queue = Ember.View.extend({
  templateName: "queue",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list", "active"],
  contentBinding: "Spotbox.Controllers.QueuedTracks.content",

  showContent: function() {
    return this.get("content").length > 0;
  }.property("content"),

  queueItem: Ember.View.extend({
    username: function() {
      return Spotbox.username(this.getPath("content.meta.user"));
    }.property("content")
  })
});

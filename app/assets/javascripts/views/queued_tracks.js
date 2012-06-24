Spotbox.QueuedTracksView = Ember.View.extend({
  templateName: "queued_tracks",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list", "active"],
  contentBinding: "Spotbox.queuedTracksController.content",

  didInsertElement: function() {
    console.log("inserted view");
  },

  queueItem: Ember.View.extend({
    username: function() {
      return this.getPath("content.meta.user.name");
    }.property("content")
  })
});

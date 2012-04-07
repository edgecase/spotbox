Spotbox.Views.Queue = Ember.View.extend({
  templateName: "queue",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list", "active"],

  contentBinding: "Spotbox.Controllers.QueuedTracks.content",

  showContent: function() {
    return this.get("content").length > 0;
  }.property("content")
});

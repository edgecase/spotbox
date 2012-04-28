Spotbox.Views.Queue = Ember.View.extend({
  templateName: "queue",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list", "active"],

  contentBinding: "Spotbox.Controllers.QueuedTracks.content",

  collectionView: Ember.CollectionView.extend({
    contentBinding: "parentView.content",
    itemViewClass: Ember.View.extend({
      tagName: "tr"
    })
  }),

  showContent: function() {
    return this.get("content").length > 0;
  }.property("content")
});

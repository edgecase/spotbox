Spotbox.Views.Recent = Ember.View.extend({
  templateName: "recent",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list"],
  contentBinding: "Spotbox.Controllers.PlayedTracks.content",

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

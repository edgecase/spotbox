Spotbox.Views.Recent = Ember.View.extend({
  templateName: "recent",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list"],
  contentBinding: "Spotbox.Controllers.PlayedTracks.content"
});

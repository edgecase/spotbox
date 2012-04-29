Spotbox.Views.TopArtists = Ember.View.extend({
  templateName: "top_artists",
  tagName: "table",
  classNames: ["table table-striped"],
  contentBinding: "Spotbox.Controllers.Stats.topArtists"
});

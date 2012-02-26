Spotbox.Views.Playlists = Ember.View.extend({
  templateName: "playlists",
  classNames: ["playlists"],
  contentBinding: "Spotbox.Controllers.Playlists.content",
  selectedBinding: "Spotbox.Controllers.Playlists.selected"
});

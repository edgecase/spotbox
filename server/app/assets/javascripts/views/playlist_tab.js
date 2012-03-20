Spotbox.Views.PlaylistTab = Ember.View.extend({
  templateName: "playlist_tab",
  tagName: "li",
  classNames: ["dropdown"],

  filterBox: Ember.View.extend({
    tagName: "input",
    classNames: ['search-query'],

    click: function(e) {
      e.stopPropagation();
    },

    keyUp: function(e) {
      var playlistPrefix = $(e.target).val();
      Spotbox.Controllers.Playlists.set('prefix', playlistPrefix);
    }
  })

});

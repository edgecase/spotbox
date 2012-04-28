Spotbox.Views.PlaylistTab = Ember.View.extend({
  templateName: "playlist_tab",
  tagName: "li",
  classNames: ["dropdown"],

  collectionView: Ember.CollectionView.extend({
    contentBinding: "Spotbox.Controllers.Playlists",
    itemViewClass: Ember.View.extend({
      tagName: 'li',
      isVisible: function() {
        var prefix = Spotbox.Controllers.Playlists.get("prefix");
        if (prefix.length === 0) {
          return true;
        } else {
          return new RegExp("^" + prefix, "i").test(this.getPath('content.name'));
        }
      }.property('Spotbox.Controllers.Playlists.prefix'),
      click: function(event) {
        event.preventDefault();
        Spotbox.Controllers.Playlists.changePlaylist(this.getPath("content.id"));
      }
    })
  }),

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

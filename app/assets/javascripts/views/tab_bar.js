Spotbox.Views.TabBar = Ember.View.extend({
  id: "tab-bar",
  classNames: ["nav nav-tabs"],
  templateName: "tab_bar",
  tagName: "ul",

  QueueTab: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    isActive: function() {
      return Spotbox.TabManager.getPath("currentState.name") === "viewingQueue"
    }.property("Spotbox.TabManager.currentState")
  }),

  SearchTab: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    isActive: function() {
      return Spotbox.TabManager.getPath("currentState.name") === "viewingSearch"
    }.property("Spotbox.TabManager.currentState")
  }),

  RecentTab: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    isActive: function() {
      return Spotbox.TabManager.getPath("currentState.name") === "viewingRecent"
    }.property("Spotbox.TabManager.currentState")
  }),

  StatsTab: Ember.View.extend({
    tagName: "li",
    classNames: ["dropdown"],
    classNameBindings: ["isActive:active"],
    isActive: function() {
      var state = Spotbox.TabManager.getPath("currentState.name");
      return state === "viewingTopTracks"  ||
             state === "viewingTopSkipped" ||
             state === "viewingTopArtists";
    }.property("Spotbox.TabManager.currentState")
  }),

  PlaylistsTab: Ember.View.extend({
    tagName: "li",
    classNames: ["dropdown"],
    classNameBindings: ["isActive:active"],
    contentBinding: "Spotbox.Controllers.Playlists",

    isActive: function() {
      var state = Spotbox.TabManager.getPath("currentState.name");
      return state === "viewingCurrentPlaylist";
    }.property("Spotbox.TabManager.currentState"),

    FilterBox: Ember.View.extend({
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
  })
});

Spotbox.Views.PlaylistsTabItem = Ember.View.extend({
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
    Spotbox.TabManager.goToState("viewingCurrentPlaylist");
    Spotbox.Controllers.Playlists.changePlaylist(this.getPath("content.id"));
  }
})

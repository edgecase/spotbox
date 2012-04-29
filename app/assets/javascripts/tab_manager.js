Spotbox.TabManager = Ember.StateManager.create({
  rootElement: "#tab-content",

  showQueue: function(mgr) { mgr.goToState('viewingQueue'); },
  showSearch: function(mgr) { mgr.goToState('viewingSearch'); },
  showRecent: function(mgr) { mgr.goToState('viewingRecent'); },
  showTopTracks: function(mgr) { mgr.goToState('viewingTopTracks'); },
  showTopArtists: function(mgr) { mgr.goToState('viewingTopArtists'); },
  showTopSkipped: function(mgr) { mgr.goToState('viewingTopSkipped'); },
  showCurrentPlaylist: function(mgr) { mgr.goToState('viewingCurrentPlaylist'); },

  viewingQueue: Ember.ViewState.create({
    view: Spotbox.Views.Queue
  }),

  viewingSearch: Ember.ViewState.create({
    view: Spotbox.Views.SearchResults
  }),

  viewingRecent: Ember.ViewState.create({
    view: Spotbox.Views.Recent
  }),

  viewingTopArtists: Ember.ViewState.create({
    view: Spotbox.Views.TopArtists
  }),

  viewingTopTracks: Ember.ViewState.create({
    view: Spotbox.Views.TopTracks
  }),

  viewingTopSkipped: Ember.ViewState.create({
    view: Spotbox.Views.TopSkipped
  }),

  viewingCurrentPlaylist: Ember.ViewState.create({
    view: Spotbox.Views.Playlist
  }),
});

// HACK: Couldn't get ember to render initialState
// Tried with both rootElement and rootView
$(function() { Spotbox.TabManager.goToState("viewingQueue"); });

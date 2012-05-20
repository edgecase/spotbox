Spotbox.TabManager = Ember.StateManager.create({
  rootElement: "#tab-content",

  showQueue: function(mgr) { mgr.goToState('viewingQueue'); },
  showSearch: function(mgr) { mgr.goToState('viewingSearch'); },

  viewingQueue: Ember.ViewState.create({
    view: Spotbox.Views.Queue
  }),

  viewingSearch: Ember.ViewState.create({
    view: Spotbox.Views.SearchResults
  })
});

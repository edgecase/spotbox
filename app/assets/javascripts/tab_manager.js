Spotbox.StateManagers.TabManager = Ember.StateManager.extend({
  queue: Ember.ViewState.create({
    view: Spotbox.Views.Queue
  }),

  search: Ember.ViewState.create({
    view: Spotbox.Views.SearchResults
  }),

  uploads: Ember.ViewState.create({
    view: Spotbox.Views.UserUploads
  })
});

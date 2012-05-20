Spotbox.TabManager = Ember.StateManager.create({
  rootElement: "#tab-content",

  queue: Ember.ViewState.create({
    view: Spotbox.Views.Queue
  }),

  search: Ember.ViewState.create({
    view: Spotbox.Views.SearchResults
  })
});

page("/", function(ctx) {
  ctx.save();
  Spotbox.TabManager.goToState("queue")
});
page("/search", function(ctx) {
  ctx.save();
  Spotbox.TabManager.goToState("search")
});

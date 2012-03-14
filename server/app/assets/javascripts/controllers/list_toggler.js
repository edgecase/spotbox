Spotbox.Controllers.ListToggler = Ember.Object.create({
  currentView: "queuedTracks",

  isDisplayingQueue: function() {
    return this.get("currentView") === "queuedTracks";
  }.property("currentView"),

  isDisplayingRecent: function() {
    return this.get("currentView") === "recentTracks";
  }.property("currentView"),

  isDisplayingSearch: function() {
    return this.get("currentView") === "searchTracks";
  }.property("currentView")
});

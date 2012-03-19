Spotbox.Controllers.ListToggler = Ember.Object.create({
  currentTab: "queue",

  isDisplayingQueue: function() {
    return this.get("currentTab") === "queue";
  }.property("currentTab"),

  isDisplayingRecent: function() {
    return this.get("currentTab") === "recent";
  }.property("currentTab"),

  isDisplayingSearch: function() {
    return this.get("currentTab") === "search";
  }.property("currentTab"),

  isDisplayingPlaylists: function() {
    return this.get("currentTab") === "playlists";
  }.property("currentTab")
});

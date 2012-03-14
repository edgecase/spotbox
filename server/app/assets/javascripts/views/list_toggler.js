Spotbox.Views.ListToggler = Ember.View.extend({
  templateName: "list_toggler",
  tagName: "ul",
  classNames: ["nav", "nav-tabs"],
  activeClass: "active",
  displayingQueue: true,

  currentViewObserver: function() {
    this.set("displayingQueue", false);
    this.set("displayingRecent", false);
    this.set("displayingSearch", false);

    var currentView = Spotbox.Controllers.ListToggler.get("currentView");

    if (currentView === "queuedTracks") {
      this.set("displayingQueue", true);
    } else if (currentView === "searchTracks") {
      this.set("displayingSearch", true);
    } else if (currentView === "recentTracks") {
      this.set("displayingRecent", true);
    }
  }.observes("Spotbox.Controllers.ListToggler.currentView"),

  setDisplayRecent: function() {
    Spotbox.Controllers.ListToggler.set("currentView", "recentTracks");
  },

  setDisplayQueue: function() {
    Spotbox.Controllers.ListToggler.set("currentView", "queuedTracks");
  },

  setDisplaySearch: function() {
    Spotbox.Controllers.ListToggler.set("currentView", "searchTracks");
  }
});

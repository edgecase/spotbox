Spotbox.Views.ListToggler = Ember.View.extend({
  templateName: "list_toggler",
  tagName: "ul",
  classNames: ["nav", "nav-tabs"],

  setCurrentTab: function(view, event, ctx) {
    event.preventDefault();
    var tab = $(event.target).data("tab");
    Spotbox.Controllers.ListToggler.set("currentTab", tab);
  },

  // Tab Views

  QueueTab: Ember.View.extend({
    tagName: "li",
    active: function() {
      return Spotbox.Controllers.ListToggler.get("currentTab") === "queue";
    }.property("Spotbox.Controllers.ListToggler.currentTab")
  }),

  SearchTab: Ember.View.extend({
    tagName: "li",
    active: function() {
      return Spotbox.Controllers.ListToggler.get("currentTab") === "search";
    }.property("Spotbox.Controllers.ListToggler.currentTab")
  }),

  RecentTab: Ember.View.extend({
    tagName: "li",
    active: function() {
      return Spotbox.Controllers.ListToggler.get("currentTab") === "recent";
    }.property("Spotbox.Controllers.ListToggler.currentTab")
  }),

  PlaylistsTab: Ember.View.extend({
    tagName: "li",
    active: function() {
      return Spotbox.Controllers.ListToggler.get("currentTab") === "playlists";
    }.property("Spotbox.Controllers.ListToggler.currentTab")
  })
});

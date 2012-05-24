Spotbox.Views.TabBar = Ember.View.extend({
  id: "tab-bar",
  classNames: ["nav nav-tabs"],
  templateName: "tab_bar",
  tagName: "ul",

  QueueTab: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    click: function(event) {
      event.preventDefault();
      page("/");
    },
    isActive: function() {
      return Spotbox.TabManager.getPath("currentState.name") === "queue"
    }.property("Spotbox.TabManager.currentState")
  }),

  SearchTab: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    click: function(event) {
      event.preventDefault();
      page("/search");
    },
    isActive: function() {
      return Spotbox.TabManager.getPath("currentState.name") === "search"
    }.property("Spotbox.TabManager.currentState")
  }),

  UploadsTab: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    click: function(event) {
      event.preventDefault();
      page("/uploads");
    },
    isActive: function() {
      return Spotbox.TabManager.getPath("currentState.name") === "uploads"
    }.property("Spotbox.TabManager.currentState")
  })
});

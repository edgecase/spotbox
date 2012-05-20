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
  })
});

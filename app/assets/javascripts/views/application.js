Spotbox.ApplicationView = Ember.View.extend({
  templateName: "application",
  tabView: Ember.View.extend({
    tagName: "li",
    classNameBindings: ["isActive:active"],
    click: function(event) {
      Spotbox.router.transitionTo(this.get("name"));
    },
    isActive: function() {
      return this.get("name") === Spotbox.router.getPath("currentState.name");
    }.property("Spotbox.router.currentState")
  })
});

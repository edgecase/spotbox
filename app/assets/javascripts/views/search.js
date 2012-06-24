Spotbox.SearchView = Ember.View.extend({
  templateName: "search",
  categoryButton: Ember.View.extend({
    classNames: "btn",
    classNameBindings: ["active"],
    click: function(event) {
      this.setPath("controller.displayCategory", this.get("name"));
    },
    active: function() {
      var category = this.getPath("controller.displayCategory");
      return category === this.get("name");
    }.property("controller.displayCategory")
  }),

  searchResultsItem: Ember.View.extend({
    tagName: "tr",
    enqueue: function() {
      Spotbox.router.queueController.enqueue(this.get("content"));
      this.remove();
    }
  })
});

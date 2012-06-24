Spotbox.SearchResultsView = Ember.View.extend({
  templateName: "search_results",
  contentBinding: "Spotbox.searchController.content",

  showContent: function() {
    return (Spotbox.searchController.get("content").length > 0) && !Spotbox.searchController.get("searching");
  }.property("Spotbox.searchController.content", "Spotbox.searchController.searching"),

  setSortKey: function(event) {
    var key = $(event.target).data("key");

    if (key === Spotbox.searchController.get("sortKey")) {
      Spotbox.searchController.set("sortKey", null);
    } else {
      Spotbox.searchController.set("sortKey", key);
    }
  },

  categoryButton: Ember.View.extend({
    classNames: "btn",
    classNameBindings: ["active"],
    click: function(event) {
      Spotbox.searchController.set("displayCategory", this.get("name"));
    },
    active: function() {
      var category = Spotbox.searchController.get("displayCategory");
      return category === this.get("name");
    }.property("Spotbox.searchController.displayCategory")
  }),

  searchResultsItem: Ember.View.extend({
    tagName: "tr",
    enqueue: function() {
      Spotbox.queuedTracksController.enqueue(this.get("content"));
      this.remove();
    }
  })
});

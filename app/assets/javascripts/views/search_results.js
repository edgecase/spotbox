Spotbox.Views.SearchResults = Ember.View.extend({
  templateName: "search_results",
  contentBinding: "Spotbox.Controllers.Search.content",

  showContent: function() {
    return (Spotbox.Controllers.Search.get("content").length > 0) && !Spotbox.Controllers.Search.get("searching");
  }.property("Spotbox.Controllers.Search.content", "Spotbox.Controllers.Search.searching"),

  setSortKey: function(event) {
    event.preventDefault();
    var key = $(event.target).data("key");

    if (key === Spotbox.Controllers.Search.get("sortKey")) {
      Spotbox.Controllers.Search.set("sortKey", null);
    } else {
      Spotbox.Controllers.Search.set("sortKey", key);
    }
  },

  categoryButton: Ember.View.extend({
    classNames: "btn",
    classNameBindings: ["active"],
    click: function(event) {
      Spotbox.Controllers.Search.set("displayCategory", this.get("name"));
    },
    active: function() {
      var category = Spotbox.Controllers.Search.get("displayCategory");
      return category === this.get("name");
    }.property("Spotbox.Controllers.Search.displayCategory")
  }),

  searchResultsItem: Ember.View.extend({
    tagName: "tr",
    enqueue: function() {
      Spotbox.Controllers.QueuedTracks.enqueue(this.get("content"));
      this.remove();
    }
  })
});

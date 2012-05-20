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

  categoryButton: Spotbox.Views.Button.extend({
    click: function(event) {
      Spotbox.Controllers.Search.set("displayCategory", this.get("name"));
    },
    active: function() {
      var category = Spotbox.Controllers.Search.get("displayCategory");
      return category === this.get("name");
    }.property("Spotbox.Controllers.Search.displayCategory")
  })
});

// This view (unfortunately) needs to be global because it is used in an #each block.
Spotbox.Views.SearchResultsItem = Ember.View.extend({
  tagName: "tr",
  enqueue: function() {
    Spotbox.Controllers.QueuedTracks.enqueue(this.get("content"));
    this.remove();
  }
});

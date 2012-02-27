Spotbox.Views.SearchResults = Ember.View.extend({
  templateName: "search_results",
  contentBinding: "Spotbox.Controllers.Search.content",
  clear: function() {
    Spotbox.Controllers.Search.set("content", []);
  },
  showContent: function() {
    return Spotbox.Controllers.Search.get("content").length > 0;;
  }.property("Spotbox.Controllers.Search.content")
});

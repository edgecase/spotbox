Spotbox.Views.SearchResults = Ember.View.extend({
  templateName: "search_results",
  tagName: "table",
  classNames: ["table", "table-striped", "search_results", "tab-pane"],

  contentBinding: "Spotbox.Controllers.Search.content",

  clear: function() {
    Spotbox.Controllers.Search.set("content", []);
  },

  showContent: function() {
    return Spotbox.Controllers.Search.get("content").length > 0;
  }.property("Spotbox.Controllers.Search.content"),

  setSortKey: function(view, event, ctx) {
    event.preventDefault();

    var key = $(event.target).data("key");

    if (key === Spotbox.Controllers.Search.get("sortKey")) {
      Spotbox.Controllers.Search.set("sortKey", null);
    } else {
      Spotbox.Controllers.Search.set("sortKey", key);
    }
  }

});

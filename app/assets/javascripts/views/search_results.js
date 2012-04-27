Spotbox.Views.SearchResults = Ember.View.extend({
  templateName: "search_results",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list"],

  contentBinding: "Spotbox.Controllers.Search.content",

  spinner: new Spinner(),

  clear: function() {
    Spotbox.Controllers.Search.set("content", []);
  },

  showContent: function() {
    return Spotbox.Controllers.Search.get("content").length > 0 &&
           !Spotbox.Controllers.Search.get("searching");
  }.property("Spotbox.Controllers.Search.content",
             "Spotbox.Controllers.Search.searching"),

  setSortKey: function(event) {
    event.preventDefault();
    var key = $(event.target).data("key");

    if (key === Spotbox.Controllers.Search.get("sortKey")) {
      Spotbox.Controllers.Search.set("sortKey", null);
    } else {
      Spotbox.Controllers.Search.set("sortKey", key);
    }
  },

  displaySpinner: function() {
    if (Spotbox.Controllers.Search.get("searching")) {
      $("#search").prepend(this.spinner.spin().el);
    } else {
      this.spinner.stop();
    }
  }.observes("Spotbox.Controllers.Search.searching"),

});

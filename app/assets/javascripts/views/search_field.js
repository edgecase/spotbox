Spotbox.SearchFieldView = Ember.TextField.extend({
  classNames: ["search-query"],
  placeholder: "Search",
  query: "",
  valueBinding: "query",
  attributeBindings: ["disabled"],

  disabled: function() {
    return Spotbox.router.getPath("searchController.searching");
  }.property("Spotbox.router.searchController.searching"),

  submit: function(event) {
    Spotbox.router.get("searchController").search(this.get("query"));
    //TODO: Router
    // page("/search");
  },

  insertNewline: function(event) {
    this.submit(function() {});
  }
});

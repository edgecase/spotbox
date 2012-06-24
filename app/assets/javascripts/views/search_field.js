Spotbox.SearchFieldView = Ember.TextField.extend({
  classNames: ["search-query"],
  placeholder: "Search",
  query: "",
  valueBinding: "query",
  attributeBindings: ["disabled"],
  disabled: function() {
    return Spotbox.router.searchController.get("searching");
  }.property("Spotbox.router.searchController.searching"),
  submit: function(event) {
    Spotbox.router.searchController.search(this.get("query"));
    Spotbox.router.transitionTo("search");
  },
  insertNewline: function(event) {
    this.submit(function() {});
  }
});

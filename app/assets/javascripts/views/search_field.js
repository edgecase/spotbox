Spotbox.Views.SearchField = Ember.TextField.extend({
  classNames: ["search-query"],
  placeholder: "Search",
  query: "",
  valueBinding: "query",
  attributeBindings: ["disabled"],

  disabled: function() {
    return Spotbox.Controllers.Search.get("searching");
  }.property("Spotbox.Controllers.Search.searching"),

  submit: function(event) {
    Spotbox.Controllers.Search.search(this.get("query"));
    page("/search");
  },

  insertNewline: function(event) {
    event.preventDefault();
    this.submit(function() {});
  }
});

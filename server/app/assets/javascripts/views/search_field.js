Spotbox.Views.SearchField = Ember.TextField.extend({
  classNames: ["search-query"],
  placeholder: "Search",
  modelBinding: "Spotbox.Controllers.Search.searchModel",
  valueBinding: "model.query",
  attributeBindings: ["disabled"],

  disabled: function() {
    return Spotbox.Controllers.Search.searching;
  }.property("Spotbox.Controllers.Search.searching"),

  focusIn: function() {
    $('#search-tab').tab('show');
  },

  submit: function(event) {
    Spotbox.Controllers.Search.search();
  },

  insertNewline: function(event) {
    event.preventDefault();
    this.submit(function() {});
  }

});

Spotbox.Views.SearchResult = Ember.View.extend({
  templateName: "search_result",
  classNames: ["well"],
  tagName: "li",
  click: function() {
    console.log('click');
    this.set("disabled");
    console.log(this.get("model"));
  }
});

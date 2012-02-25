Spotbox.Views.SearchResult = Ember.View.extend({
  templateName: "search_result",
  tagName: "li",
  enqueue: function() {
    Spotbox.Controllers.Queue.enqueue(this.get("model"));
    this.remove();
  }
});

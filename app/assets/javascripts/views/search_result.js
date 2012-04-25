Spotbox.Views.SearchResult = Ember.View.extend({
  templateName: "search_result",
  tagName: "tr",

  enqueue: function() {
    Spotbox.Controllers.QueuedTracks.enqueue(this.get("model"));
    this.remove();
  }
});

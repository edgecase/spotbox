Spotbox.Views.SearchResult = Ember.View.extend({
  templateName: "search_result",
  tagName: "li",
  available: function() {
    return _.include(this.get("model").track.album.availability.territories.split(" "), "US");
  }.property("model"),
  enqueue: function() {
    Spotbox.Controllers.Queue.enqueue(this.get("model"));
    this.remove();
  }
});

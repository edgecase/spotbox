Spotbox.Models.SearchResult = Ember.Object.extend({
  available: function() {
    return _.include(this.get("album").availability.territories.split(" "), "US");
  }.property("album.availability")
});

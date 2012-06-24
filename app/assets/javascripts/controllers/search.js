Spotbox.SearchController = Ember.ArrayController.extend({
  content: [],
  searchResults: {itunes: [], spotify: []},
  searching: false,
  displayCategory: null,
  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/search", function(results) {
      var searchResults = {};
      var spotifyResults = _.filter(results.spotify, function(result) {
        return _.include(result.availability.territories.split(" "), "US");
      });
      searchResults.spotify = _.map(spotifyResults, function(result) {
        return Spotbox.Track.create(result);
      });
      searchResults.itunes = _.map(results.itunes, function(result) {
        return Spotbox.Track.create(result);
      });
      self.set("searchResults", searchResults);
      var category = self.get("displayCategory");
      if (category) {
        self.set("content", searchResults[category]);
      } else {
        self.set("displayCategory", "spotify");
      }
      self.set("searching", false);
    });
  },
  search: function(query) {
    this.set("searching", true);
    Spotbox.socket.emit("tracks/search", query);
  },
  switchCategory: function() {
    var category = this.get("displayCategory");
    var results = this.get("searchResults")[category];
    this.set("content", results);
  }.observes("displayCategory")
});

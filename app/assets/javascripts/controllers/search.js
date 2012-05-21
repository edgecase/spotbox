Spotbox.Controllers.Search = Ember.ArrayController.create({
  content: [],
  searchResults: {itunes: [], spotify: []},
  searching: false,
  displayCategory: null,
  sortKey: null,

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/search", function(results) {
      var searchResults = {};
      var spotifyResults = _.filter(results.spotify, function(result) {
        return _.include(result.availability.territories.split(" "), "US");
      });
      searchResults.spotify = _.map(spotifyResults, function(result) {
        return Spotbox.Models.Track.create(result);
      });
      searchResults.itunes = _.map(results.itunes, function(result) {
        return Spotbox.Models.Track.create(result);
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

  sortContent: function() {
    var key     = this.get("sortKey");
    var results = this.get("content");

    if (_.isNull(key)) {
      // TODO: Temp Hack
      // For some reason reverse by itself doesn't force a render.
      // Perhaps something to do with reverse happening in place?
      this.set("content", results.slice().reverse());
    } else {
      this.set("content", _.sortBy(results, function(result) {
        return result.get(key);
      }));
    }
  }.observes("sortKey"),

  switchCategory: function() {
    var category = this.get("displayCategory");
    var results = this.get("searchResults")[category];
    this.set("content", results);
  }.observes("displayCategory")
});

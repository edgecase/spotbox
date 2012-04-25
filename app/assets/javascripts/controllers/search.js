Spotbox.Controllers.Search = Ember.ArrayController.create({
  content: [],
  searchModel: {},
  searching: false,
  sortKey: null,

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/search/result", function(results) {
      if (results.error) {
        Spotbox.errorMessage("Search Error", "encountered while searching for tracks");
        self.set("content", []);
        self.set("searching", false);
      } else {
        var valid_results = _.filter(results, function(result) {
          return _.include(result.availability.territories.split(" "), "US");
        });
        results = _.map(valid_results, function(result) {
          return Spotbox.Models.Track.create(result);
        });
        self.set("content", results);
        self.set("searching", false);
      }
    });
  },

  search: function() {
    this.set("searching", true);
    var model = this.get("searchModel");
    Spotbox.socket.emit("tracks/search", model);
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
  }.observes("sortKey")

});

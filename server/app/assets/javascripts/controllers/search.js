Spotbox.Controllers.Search = Ember.ArrayController.create({
  content: [],
  searchModel: {},
  searching: false,

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/search/result", function(results) {
      self.set("searching", false);
      var valid_results = _.filter(results, function(result) {
        return _.include(result.album.availability.territories.split(" "), "US");
      });
      results = _.map(valid_results, function(result) {
        return Spotbox.Models.Track.create(result);
      });
      self.set("content", results);
    });
  },

  search: function() {
    this.set("searching", true);
    var model = this.get("searchModel");
    Spotbox.socket.emit("tracks/search", model);
  }
});

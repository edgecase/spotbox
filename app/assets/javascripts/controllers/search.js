Spotbox.Controllers.Search = Ember.ArrayController.create({
  content: [],
  searchModel: {type: "track"},
  searching: false,

  init: function() {
    var self = this;
    Spotbox.socket.on("search/result", function(results) {
      self.set("searching", false);
      self.set("content", results.tracks);
    });
  },

  search: function() {
    this.set("searching", true);
    var model = this.get("searchModel");
    Spotbox.socket.emit("search", model);
  }
});

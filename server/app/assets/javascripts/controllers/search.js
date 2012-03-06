Spotbox.Controllers.Search = Ember.ArrayController.create({
  content: [],
  searchModel: {},
  searching: false,

  init: function() {
    var self = this;
    Spotbox.socket.on("tracks/search/result", function(results) {
      self.set("searching", false);
      self.set("content", results);
    });
  },

  search: function() {
    this.set("searching", true);
    var model = this.get("searchModel");
    Spotbox.socket.emit("tracks/search", model);
  }
});
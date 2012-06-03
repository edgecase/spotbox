Spotbox.Controllers.Uploads = Ember.ArrayController.create({
  content: [],

  init: function() {
    var self = this;
    Spotbox.socket.on("uploads/list", function(results) {
      var tracks = _.map(results, function(track) {
        return Spotbox.Models.Track.create(track);
      });
      self.set("content", tracks);
    });
  },

  retrieve: function() {
    Spotbox.socket.emit("tracks/uploads");
  },

  upload: function(file) {
    var self = this;
    var model = Spotbox.Models.Upload.create({file: file});
    this.unshiftObject(model);
    model.upload(function(error, data) {
      self.removeObjects(model);
      if (error) {
        Spotbox.errorMessage("Error", JSON.parse(error.responseText).message);
      } else {
        Spotbox.successMessage("Complete", "File upload complete");
      }
    });
  }
});

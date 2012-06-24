Spotbox.UploadsController = Ember.ArrayController.extend({
  content: [],
  active: [],
  init: function() {
    var self = this;
    Spotbox.socket.on("uploads", function(results) {
      var tracks = _.map(results, function(track) {
        return Spotbox.Track.create(track);
      });
      self.set("content", tracks);
    });
  },
  upload: function(file) {
    var self = this;
    var model = Spotbox.Upload.create({file: file});
    model.upload(function(error, data) {
      if (error) {
        Spotbox.errorMessage("Error", JSON.parse(error.responseText).message);
      } else {
        Spotbox.socket.emit("tracks/uploads");
        Spotbox.successMessage("Complete", "File upload complete");
      }
    });
  }
});

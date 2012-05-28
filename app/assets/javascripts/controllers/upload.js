Spotbox.Controllers.Uploads = Ember.ArrayController.create({
  content: [],

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

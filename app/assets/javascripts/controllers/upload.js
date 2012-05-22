Spotbox.Controllers.Uploads = Ember.ArrayController.create({
  content: [],

  upload: function(file) {
    var self = this;
    var model = Spotbox.Models.Upload.create({file: file});
    this.unshiftObject(model);
    model.upload(function(data) {
      self.removeObjects(model);
      Spotbox.successMessage("Complete", "File upload complete");
    });
  }
});

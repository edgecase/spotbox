window.Spotbox = Ember.Application.create({
  ready: function() {
    Spotbox.Views.Layout.create().append();
    Spotbox.TabManager.goToState("viewingQueue");
  }
});

Spotbox.errorMessage = function(tagline, description) {
  Spotbox.Views.Alert.create({tagline: tagline, description: description, alertError: true}).appendTo(".alerts .messages");
};

Spotbox.successMessage = function(tagline, description) {
  Spotbox.Views.Alert.create({tagline: tagline, description: description, alertSuccess: true}).appendTo(".alerts .messages");
};

Spotbox.itunesParam = function(str) {
  var lowerCaseWithoutAmpersands = new String(str.toLowerCase().split("&").join("and"));
  return lowerCaseWithoutAmpersands.replace(/[^a-zA-Z0-9]+/g, '');
};

// Namespaces
Spotbox.Views = {};
Spotbox.Models = {};
Spotbox.Controllers = {};
Spotbox.socket = io.connect();

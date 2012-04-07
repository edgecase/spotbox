window.Spotbox = Ember.Application.create({
  ready: function() {
    Spotbox.Views.Layout.create().append();
  }
});

Spotbox.errorMessage = function(tagline, description) {
  Spotbox.Views.Alert.create({tagline: tagline, description: description, alertError: true}).appendTo(".alerts .messages");
};

Spotbox.successMessage = function(tagline, description) {
  Spotbox.Views.Alert.create({tagline: tagline, description: description, alertSuccess: true}).appendTo(".alerts .messages");
}

// Namespaces
Spotbox.Views = {};
Spotbox.Models = {};
Spotbox.Controllers = {};
Spotbox.socket = io.connect();

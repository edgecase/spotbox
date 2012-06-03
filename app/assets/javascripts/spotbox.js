window.Spotbox = Ember.Application.create({
  ready: function() {
    Spotbox.Views.Layout.create().append();
    var tabContainer = Ember.ContainerView.create();
    tabContainer.appendTo(".tab-content");
    Spotbox.TabManager = Spotbox.StateManagers.TabManager.create({rootView: tabContainer});
    page(window.location.pathname);
  },

  errorMessage: function(tagline, description) {
    Spotbox.Views.Alert.create({tagline: tagline, description: description, alertError: true}).appendTo(".messages");
  },

  successMessage: function(tagline, description) {
    Spotbox.Views.Alert.create({tagline: tagline, description: description, alertSuccess: true}).appendTo(".messages");
  },

  itunesParam: function(str) {
    var lowerCaseWithoutAmpersands = new String(str.toLowerCase().split("&").join("and"));
    return lowerCaseWithoutAmpersands.replace(/[^a-zA-Z0-9]+/g, '');
  }
});


// Namespaces
Spotbox.Views = {};
Spotbox.Models = {};
Spotbox.Controllers = {};
Spotbox.StateManagers = {};
Spotbox.socket = io.connect();

window.Spotbox = Ember.Application.create({
  ready: function() {
    Spotbox.Views.Layout.create().append();
    var tabContainer = Ember.ContainerView.create();
    var messageContainer = Ember.ContainerView.create();
    tabContainer.appendTo(".tab-content");
    messageContainer.appendTo(".message-container");
    Spotbox.TabManager = Spotbox.StateManagers.TabManager.create({rootView: tabContainer});
    Spotbox.MessageContainer = messageContainer;
    page(window.location.pathname);
  },

  errorMessage: function(tagline, description) {
    Spotbox.MessageContainer.get("childViews").pushObject(
      Spotbox.Views.Alert.create({tagline: tagline, description: description, alertError: true})
    );
  },

  successMessage: function(tagline, description) {
    Spotbox.MessageContainer.get("childViews").pushObject(
      Spotbox.Views.Alert.create({tagline: tagline, description: description, alertSuccess: true})
    );
  },

  username: function(user) {
    if (user) {
      return _.map(user.email.split("@")[0].split("."), _.capitalize).join(" ");
    } else {
      return "Anonymous Coward";
    }
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

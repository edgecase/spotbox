window.Spotbox = Ember.Application.create({
  ready: function() {
    // Populate initial outlets
    var ac = Spotbox.router.applicationController;
    ac.connectOutlet({name: "player", outletName: "player"});
    ac.connectOutlet({name: "airfoil", outletName: "airfoil"});
    ac.connectOutlet({name: "users", outletName: "users"});
    ac.connectOutlet({name: "messages", outletName: "messages"});
  },

  errorMessage: function(title, text) {
    Spotbox.router.messagesController.pushObject({"alert-error": true, title: title, text: text});
  },

  successMessage: function(title, text) {
    Spotbox.router.messagesController.pushObject({"alert-success": true, title: title, text: text});
  },

  itunesParam: function(str) {
    var lowerCaseWithoutAmpersands = new String(str.toLowerCase().split("&").join("and"));
    return lowerCaseWithoutAmpersands.replace(/[^a-zA-Z0-9]+/g, '');
  }
});

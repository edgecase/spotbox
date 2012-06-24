window.Spotbox = Ember.Application.create({
  errorMessage: function(tagline, description) {
    // TODO: Convert message container to a message controller with a view etc
    Spotbox.MessageContainer.get("childViews").pushObject(
      Spotbox.AlertView.create({tagline: tagline, description: description, alertError: true})
    );
  },

  successMessage: function(tagline, description) {
    Spotbox.MessageContainer.get("childViews").pushObject(
      Spotbox.AlertView.create({tagline: tagline, description: description, alertSuccess: true})
    );
  },

  itunesParam: function(str) {
    var lowerCaseWithoutAmpersands = new String(str.toLowerCase().split("&").join("and"));
    return lowerCaseWithoutAmpersands.replace(/[^a-zA-Z0-9]+/g, '');
  }
});

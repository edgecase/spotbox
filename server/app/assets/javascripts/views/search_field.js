Spotbox.Views.SearchField = Spotbox.Views.TextField.extend({

  focusIn: function() {
    Spotbox.Controllers.ListToggler.set("currentView", "searchTracks");
  },

  click: function() {
    this.set("value", "");
  }

});

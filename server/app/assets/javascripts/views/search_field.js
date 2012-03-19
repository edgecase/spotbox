Spotbox.Views.SearchField = Spotbox.Views.TextField.extend({

  focusIn: function() {
    Spotbox.Controllers.ListToggler.set("currentTab", "search");
  },

  click: function() {
    this.set("value", "");
  }

});

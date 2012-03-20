Spotbox.Views.SearchField = Spotbox.Views.TextField.extend({

  focusIn: function() {
    $('#search-tab').tab('show');
  },

  click: function() {
    this.set("value", "");
  }

});

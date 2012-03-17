Spotbox.Views.SearchField = Spotbox.Views.TextField.extend({
  valueBinding: "model.query",
  placeHolder: "Search",

  click: function() {
    Spotbox.Controllers.ListToggler.set("currentView", "searchTracks");
  }
});

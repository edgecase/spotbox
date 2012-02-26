Spotbox.Views.Search = Ember.View.extend({
  templateName: "search",
  activeButton: "artist",
  modelBinding: "Spotbox.Controllers.Search.searchModel",
  classNames: ["form-search"],

  submit: function() {
    Spotbox.Controllers.Search.search();
  },

  searchButton: Spotbox.Views.SubmitButton.extend({
    classNameBindings: ["Spotbox.Controllers.Search.searching:disabled"],
    click: function() {
      this.get("parentView").submit();
    }
  })
});

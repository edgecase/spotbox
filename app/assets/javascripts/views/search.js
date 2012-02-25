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
  }),

  trackButton: Spotbox.Views.Button.extend({
    active: true,
    click: function(event) {
      this.setPath("parentView.model.type", "track");
    },
    activeObserver: function() {
      var type = this.getPath("parentView.model.type");
      this.set("active", type === "track");
    }.observes("parentView.model.type")
  }),

  albumButton: Spotbox.Views.Button.extend({
    click: function(event) {
      this.setPath("parentView.model.type", "album");
    },
    activeObserver: function() {
      var type = this.getPath("parentView.model.type");
      this.set("active", type === "album");
    }.observes("parentView.model.type")
  }),

  artistButton: Spotbox.Views.Button.extend({
    click: function(event) {
      this.setPath("parentView.model.type", "artist");
    },
    activeObserver: function() {
      var type = this.getPath("parentView.model.type");
      this.set("active", type === "artist");
    }.observes("parentView.model.type")
  }),
});

Spotbox.Views.Recent = Ember.View.extend({
  templateName: "recent",

  contentBinding: "Spotbox.Controllers.Recent.content",

  showContent: function() {
    return Spotbox.Controllers.Recent.get("content").length > 0;;
  }.property("Spotbox.Controllers.Recent.content")
});

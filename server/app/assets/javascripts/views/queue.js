Spotbox.Views.Queue = Ember.View.extend({
  templateName: "queue",
  tagName: "table",
  classNames: ["table", "table-striped", "search_results"],

  isVisibleBinding: "Spotbox.Controllers.ListToggler.isDisplayingQueue",
  contentBinding: "Spotbox.Controllers.Queue.content",

  showContent: function() {
    return Spotbox.Controllers.Queue.get("content").length > 0;;
  }.property("Spotbox.Controllers.Queue.content")
});

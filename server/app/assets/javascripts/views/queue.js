Spotbox.Views.Queue = Ember.View.extend({
  templateName: "queue",
  tagName: "table",
  classNames: ["table", "table-striped", "track-list", "tab-pane", "active"],

  contentBinding: "Spotbox.Controllers.Queue.content",

  showContent: function() {
    return Spotbox.Controllers.Queue.get("content").length > 0;;
  }.property("Spotbox.Controllers.Queue.content")
});

Spotbox.Views.Queue = Ember.View.extend({
  templateName: "queue",
  classNames: ["queue"],
  contentBinding: "Spotbox.Controllers.Queue.content",
  showContent: function() {
    return Spotbox.Controllers.Queue.get("content").length > 0;;
  }.property("Spotbox.Controllers.Queue.content")
});

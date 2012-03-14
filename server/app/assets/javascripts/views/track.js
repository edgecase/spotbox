Spotbox.Views.Track = Ember.View.extend({
  templateName: "track",
  tagName: "tr",

  enqueue: function() {
    Spotbox.Controllers.Queue.enqueue(this.get("model"));
    this.remove();
  }
});

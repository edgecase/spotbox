Spotbox.Views.QueuedTrack = Ember.View.extend({
  templateName: "queued_track",
  tagName: "tr",

  dequeue: function() {
    Spotbox.Controllers.Queue.dequeue(this.get("model"));
    this.remove();
  }
});

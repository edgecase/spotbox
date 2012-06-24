Spotbox.UploadsView = Ember.View.extend({
  templateName: "track_list",
  itemView: Ember.View.extend({
    tagName: "tr",
    enqueue: function() {
      Spotbox.router.queueController.enqueue(this.get("content"));
    }
  })
});

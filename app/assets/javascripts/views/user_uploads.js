Spotbox.UserUploadsView = Ember.View.extend({
  templateName: "user_uploads",

  itemView: Ember.View.extend({
    tagName: "tr",
    enqueue: function() {
      Spotbox.queuedTracksController.enqueue(this.getPath("controller.content"));
    }
  })
});

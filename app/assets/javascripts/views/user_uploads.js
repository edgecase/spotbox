Spotbox.Views.UserUploads = Ember.View.extend({
  templateName: "user_uploads",
  contentBinding: "Spotbox.Controllers.Uploads.content",

  itemView: Ember.View.extend({
    tagName: "tr",
    enqueue: function() {
      Spotbox.Controllers.QueuedTracks.enqueue(this.get("content"));
    }
  })
});

Spotbox.MessagesView = Ember.View.extend({
  templateName: "messages",
  classNames: ["row-fluid"],
  itemView: Ember.View.extend({
    classNames: ["alert"],
    classNameBindings: ["content.alert-error", "content.alert-success", "content.alert-info"],
    didInsertElement: function() {
      var self = this;
      setTimeout(function() { self.clear(); }, 10000);
    },
    clear: function(fast) {
      var controller = this.getPath("parentView.controller");
      var content = this.get("content");
      if (fast) {
        controller.removeObject(content);
      } else {
        this.$().slideUp("slow");
        setTimeout(function() { controller.removeObject(content);}, 1000);
      }
    }
  })
});

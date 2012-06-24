Spotbox.UsersView = Ember.View.extend({
  templateName: "users",
  classNames: ["users"],
  itemView: Ember.View.extend({
    classNameBindings: ["vote"],
    iconView: Ember.View.extend({
      tagName: "i",
      classNameBindings: ["icon", "kind"],
      setClassName: function() {
        var user = this.getPath("parentView.content");
        var vote = Spotbox.router.usersController.getPath("votes." + user.id);
        if (vote === "up") {
          this.setPath("parentView.vote", "like");
          this.set("icon", "icon-plus-sign");
        } else if (vote === "down") {
          this.setPath("parentView.vote", "dislike");
          this.set("icon", "icon-minus-sign");
        } else {
          this.setPath("parentView.vote", "no-vote");
          this.set("icon", "icon-question-sign");
        }
      }.observes("parentView.parentView.controller.votes"),
      didInsertElement: function() {
        this.setClassName();
      }
    })
  })
});

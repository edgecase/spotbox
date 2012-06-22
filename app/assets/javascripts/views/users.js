Spotbox.Views.Users = Ember.View.extend({
  templateName: "users",
  contentBinding: "Spotbox.Controllers.Users.content",

  userView: Ember.View.extend({
    name: function() {
      return this.getPath("user.name");
    }.property("content")
  })
});

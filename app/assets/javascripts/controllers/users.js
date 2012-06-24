Spotbox.UsersController = Ember.ArrayController.extend({
  content: [],

  init: function() {
    var self = this;
    Spotbox.socket.on("users", function(users) {
      users = _.map(users, function(user) {
        return Ember.Object.create(user);
      });
      self.set("content", users);
    });
  }
});

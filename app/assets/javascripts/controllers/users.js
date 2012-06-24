Spotbox.UsersController = Ember.ArrayController.extend({
  content: [],
  votes: Ember.Object.create(),
  init: function() {
    var self = this;
    Spotbox.socket.on("users", function(users) {
      users = _.map(users, function(user) {
        return Ember.Object.create(user);
      });
      self.set("content", users);
    });
    Spotbox.socket.on("votes", function(votes) {
      self.set("votes", Ember.Object.create(votes));
    });
  }
});

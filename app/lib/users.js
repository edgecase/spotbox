var underscore = require("underscore");

var users = {};
var Users = function() {};

Users.add = function(user) {
  users[user.id] = user;
};

Users.remove = function(user) {
  delete users[user.id];
};

Users.list = function () {
  return underscore.map(users, function(user) { return {email: user.email, name: user.name, id: user.id}; });
};

module.exports = Users;

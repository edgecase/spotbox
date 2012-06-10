var underscore = require("underscore");

var users = {};
var Users = function() {};

Users.add = function(user) {
  users[user.email] = user;
};

Users.remove = function(user) {
  delete users[user.email];
};

Users.list = function () {
  return underscore.map(users, function(user) { return {email: user.email}; });
};

Users.safeEmail = function(user) {
  return user.email.replace("\.", "_dot_");
}

module.exports = Users;

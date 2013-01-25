var path       = require("path");
var underscore = require("underscore");
var passport   = require("passport");
var passportStrategy = require("passport-local").Strategy;

var users = {
  "felix": "foo",
  "john": "foo",
  "leon": "foo",
  "doel": "foo",
  "adam": "foo",
  "darby": "foo",
  "chandu": "foo",
  "danko": "foo",
  "justine": "foo",
  "aaron": "foo"
};


var id = 0;
var users = [
  {id: id++, name: "felix", password: "password"},
  {id: id++, name: "john", password: "password"},
  {id: id++, name: "jerry", password: "password"},
  {id: id++, name: "leon", password: "password"},
  {id: id++, name: "doel", password: "password"},
  {id: id++, name: "adam", password: "password"},
  {id: id++, name: "chandu", password: "password"},
  {id: id++, name: "scott", password: "password"},
  {id: id++, name: "darby", password: "password"},
  {id: id++, name: "danko", password: "password"},
  {id: id++, name: "justine", password: "password"},
  {id: id++, name: "derek", password: "password"},
  {id: id++, name: "aaron", password: "password"},
  {id: id++, name: "delisa", password: "password"},
  {id: id++, name: "gina", password: "password"},
  {id: id++, name: "shelley", password: "password"},
  {id: id++, name: "aly", password: "password"},
  {id: id++, name: "ken", password: "password"}
];


passport.use(new passportStrategy(function(username, password, done) {
  var user = underscore.find(users, function(u){ return u.name === username; });
  if (user) {
    return done(null, user);
  } else {
    return done(null, false, {message: "You suck at logging in."});
  }
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


module.exports = function(server) {
  server.get("/login", function(request, response) {
    response.render("login");
  });

  server.post("/login",
              passport.authenticate("local", {failureRedirect: "/login"}),
              function(request, response) {
                response.redirect("/");
              });

  server.get("/logout", function(request, response){
    request.logout();
    response.redirect("/");
  });
};

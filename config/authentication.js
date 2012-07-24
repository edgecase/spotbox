var path       = require("path");
var underscore = require("underscore");
var passport   = require("passport")
var Strategy   = require("passport-google-oauth").OAuth2Strategy;
var app        = require(path.join(__dirname, "app"));
var settings   = require(path.join(app.root, "config", "settings"));
var db         = require(path.join(app.root, "config", "database"));

var passportSettings = {
  callbackURL: "/auth/google/callback",
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new Strategy(underscore.extend(passportSettings, settings.google_auth), function(accessToken, refreshToken, profile, hollaback) {
  var user = profile["_json"];
  if (!user.email.match("@" + settings.google_auth.domain)) return hollaback(null, false);
  db.collection("users", function(error, collection) {
    if (error) return hollaback(error);
    collection.update({id: user.id}, user, {safe: true, upsert: true}, function(error) {
      hollaback(null, user);
    });
  });
}));

// authentication routes
module.exports = function(server) {
  server.get("/authenticate", function(request, response, next) {
    if (app.env === "development") {
      request.login(settings.user, {}, function() { response.redirect("/")});
    } else {
      passport.authenticate("google", {scope: passportSettings.scope})(request, response, next);
    }
  }, function() {});
  server.get("/auth/google/callback", passport.authenticate("google"), function(request, response) {
    response.redirect("/");
  });
};

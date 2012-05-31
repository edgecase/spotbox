var path      = require("path");
var everyauth = require("everyauth");
var app       = require(path.join(__dirname, "app"));
var settings  = require(path.join(app.root, "config", "settings"));

var google = everyauth.google;
google.appId(settings.google_auth.app_id);
google.appSecret(settings.google_auth.app_secret);
google.scope("https://www.googleapis.com/auth/userinfo.email");
google.handleAuthCallbackError( function (request, response) { response.send(403); });
google.redirectPath('/');
google.findOrCreateUser(function(session, accessToken, accessTokenExtra, googleUserMetadata) {
  var promise = this.Promise();
  if (settings.google_auth.domain) {
    if (googleUserMetadata.email.match("@" + settings.google_auth.domain)) {
      session.email = googleUserMetadata.email;
    }
  } else {
    session.email = googleUserMetadata.email;
  }
  promise.fulfill({});
  return promise;
});

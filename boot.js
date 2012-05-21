var path              = require("path");
var underscore        = require("underscore");
var express           = require("express");
var parseCookie       = require("connect").utils.parseCookie;
var assetbuilder      = require("asset_builder");
var socketio          = require("socket.io");
var everyauth         = require("everyauth");
var AsyncRunner       = require("async_runner");
var app               = require(path.join(__dirname, "config", "app"));
var db                = require(path.join(app.root, "config", "database"));
var settings          = require(path.join(app.root, "config", "settings"));
var socketRoutes      = require(path.join(app.root, "app", "socket_routes"));
var httpRoutes        = require(path.join(app.root, "app", "http_routes"));
var emberPreprocessor = require(path.join(app.root, "app", "lib", "preprocessors", "ember_preprocessor"));
var Itunes             = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Spotify            = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Airfoil            = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));

var sessionStore = new express.session.MemoryStore;

function initExpress() {
  var server = express.createServer();
  server.configure(function() {
    this.use(express.errorHandler({
      showStack: true,
      dumpExceptions: true
    }));
    this.use(assetbuilder.middleware);
    this.use(express.static(path.join(app.root, "public")));
    this.use(express.bodyParser());
    this.use(express.methodOverride());
    this.use(express.cookieParser());
    this.use(express.session(underscore.extend({store: sessionStore}, settings.session)));
    this.use(everyauth.middleware());
    this.use(express.router(httpRoutes));
    this.set("views", path.join("app", "views"));
    this.set("view engine", "jade");
    this.set("view options", {layout: false });
  });

  assetbuilder.registerViewHelpers(server);
  assetbuilder.registerPreprocessor(emberPreprocessor);
  assetbuilder.configure({
    env: app.env
  });

  var google = everyauth.google
  google.appId(settings.google_auth.app_id)
  google.appSecret(settings.google_auth.app_secret)
  google.scope("https://www.googleapis.com/auth/userinfo.email");
  google.handleAuthCallbackError( function (request, response) { response.send(403); })
  google.findOrCreateUser(function(session, accessToken, accessTokenExtra, googleUserMetadata) {
    var promise = this.Promise();
    session.email = googleUserMetadata.email;
    promise.fulfill();
  });

  console.log("app running on " + app.port + " in " + app.env);
  server.listen(app.port);
  return server;
};

function initSockets(server) {
  var io = socketio.listen(server);
  io.configure(function () {
    io.set("transports", ["websocket"]);
    io.disable("log");
    io.set("authorization", function(data, hollaback) {
      var sessionId = parseCookie(data.headers.cookie)["connect.sid"];
      sessionStore.get(sessionId, function(error, session) {
        data.session = session;
        hollaback(error, true);
      });
    });
  });
  socketRoutes(io);
};

// Initialize database before booting app
db.open(function(error) {
  if (error) throw error;
  runner = new AsyncRunner(function() {
    initSockets(initExpress());
  });
  runner.run({}, [
    function(element, hollaback) {
      Itunes.launch(hollaback);
    },
    function(element, hollaback) {
      Spotify.launch(hollaback);
    },
    function(elemnt, hollaback) {
      Airfoil.launch(hollaback);
    }
  ]);
});

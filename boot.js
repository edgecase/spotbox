var path              = require("path");
var underscore        = require("underscore");
var http              = require("http");
var express           = require("express");
var assetbuilder      = require("asset_builder");
var passport          = require("passport");
var AsyncRunner       = require("async_runner");
var app               = require(path.join(__dirname, "config", "app"));
var db                = require(path.join(app.root, "config", "database"));
var authentication    = require(path.join(app.root, "config", "authentication"));
var settings          = require(path.join(app.root, "config", "settings"));
var socketRoutes      = require(path.join(app.root, "app", "socket_routes"));
var httpRoutes        = require(path.join(app.root, "app", "http_routes"));
var emberPreprocessor = require(path.join(app.root, "app", "lib", "preprocessors", "ember_preprocessor"));
var Itunes            = require(path.join(app.root, "app", "lib", "application_interfaces", "itunes"));
var Spotify           = require(path.join(app.root, "app", "lib", "application_interfaces", "spotify"));
var Airfoil           = require(path.join(app.root, "app", "lib", "application_interfaces", "airfoil"));

var sessionStore = new express.session.MemoryStore;

function initExpress() {
  var application = express();
  var server = http.createServer(application);
  var router = express
  application.configure(function() {
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
    this.use(passport.initialize());
    this.use(passport.session());
    authentication(application);
    httpRoutes(application);
    this.set("views", path.join("app", "views"));
    this.set("view engine", "jade");
    this.set("view options", {layout: false});
  });

  assetbuilder.registerViewHelpers(application);
  assetbuilder.registerPreprocessor(emberPreprocessor);
  assetbuilder.configure({ env: app.env });

  console.log("app running on " + app.port + " in " + app.env);
  server.listen(app.port);
  return server;
};

// Initialize database before booting app
db.open(function(error) {
  if (error) throw error;
  runner = new AsyncRunner(function() {
    socketRoutes(initExpress(), sessionStore);
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

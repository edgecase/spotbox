var path               = require("path");
var express            = require("express");
var assetbuilder       = require("asset_builder");
var config             = require(path.join(__dirname, "config"));
var http_routes        = require(path.join(config.root, "app", "http_routes"));
var socket_routes      = require(path.join(config.root, "app", "socket_routes"));
var ember_preprocessor = require(path.join(config.root, "app", "lib", "preprocessors", "ember_preprocessor"));

var server = express.createServer();
socket_routes(server);

server.configure(function() {
  this.use(express.errorHandler({
    showStack: true,
    dumpExceptions: true
  }));
  this.use(assetbuilder.middleware);
  this.use(express.static(path.join(config.root, "public")));
  this.use(express.bodyParser());
  this.use(express.methodOverride());
  this.use(express.cookieParser());
  this.use(express.router(http_routes));
  this.set("views", path.join("app", "views"));
  this.set("view engine", "jade");
  this.set("view options", {layout: false });
});

assetbuilder.registerViewHelpers(server);
assetbuilder.registerPreprocessor(ember_preprocessor);
assetbuilder.configure({
  env: config.env
});
server.listen(config.port);

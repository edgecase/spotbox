var path               = require("path");
var express            = require("express");
var assetbuilder       = require("asset_builder");
var socketio           = require("socket.io");
var config             = require(path.join(__dirname, "config"));
var http_routes        = require(path.join(config.root, "app", "http_routes"));
var socket_routes      = require(path.join(config.root, "app", "socket_routes"));
var message_bus        = require(path.join(config.root, "app", "message_bus"));
var ember_preprocessor = require(path.join(config.root, "app", "lib", "preprocessors", "ember_preprocessor"));

var server = express.createServer();
var io = socketio.listen(server);
io.configure(function () {
  io.set("transports", ["websocket"]);
  io.disable("log");
});
socket_routes(io);
message_bus(io);

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

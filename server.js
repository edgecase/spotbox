var path               = require("path");
var express            = require("express");
var assetbuilder       = require("asset_builder");
var socketio           = require("socket.io");
var config             = require(path.join(__dirname, "config"));
var http_routes        = require(path.join(config.root, "app", "http_routes"));
var socket_routes      = require(path.join(config.root, "app", "socket_routes"));
var player_routes      = require(path.join(config.root, "app", "player_routes"));
var airfoil_routes     = require(path.join(config.root, "app", "airfoil_routes"));
var ember_preprocessor = require(path.join(config.root, "app", "lib", "preprocessors", "ember_preprocessor"));
var Player             = require(path.join(config.root, "app", "lib", "player"));
var PlaylistManager    = require(path.join(config.root, "app", "lib", "playlist_manager"));
var importer           = require(path.join(config.root, "app", "lib", "importer"));

var server = express.createServer();

var io = socketio.listen(server);
io.configure(function () {
  io.set("transports", ["websocket"]);
  io.disable("log");
});

socket_routes(io);
player_routes();
airfoil_routes();

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

importer();

PlaylistManager.load_playlists();
PlaylistManager.set_playlist_id(config.settings.spotify.current_playlist);

console.log("app running on " + config.port + " in " + config.env);
server.listen(config.port);

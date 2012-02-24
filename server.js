var path               = require("path");
var express            = require("express");
var redis              = require('redis');
var config             = require(path.join(__dirname, "config"));
var router             = require(path.join(config.root, "app", "router"));
var ember_preprocessor = require(path.join(config.root, "app", "lib", "preprocessors", "ember_preprocessor"));
var Spotify            = require(path.join(config.root, "app", "lib", "spotify"));

var server = express.createServer();
server.configure(function() {
  this.use(express.errorHandler({
    showStack: true,
    dumpExceptions: true
  }));
  this.use(config.asset_builder.middleware);
  this.use(express.static(path.join(config.root, "public")));
  this.use(express.bodyParser());
  this.use(express.methodOverride());
  this.use(express.cookieParser());
  this.use(express.router(router));
  this.set("views", path.join("app", "views"));
  this.set("view engine", "jade");
  this.set("view options", {layout: false });
});

var io = require('socket.io').listen(server);

io.sockets.on("connection", function(socket) {

  config.redis.get('spotify_current', function(error, trackUri) {
    Spotify.retrieve(trackUri, function(error, track) {
      console.log("Client connected. Current track: ", track);
      socket.emit('change-current', track);
    });
  });

  socket.on('enqueue', function() {
    // retrieve from spotify
    // push to redis
    // >> broadcast to clients
  });
});

var redis_subscriptions = redis.createClient();
redis_subscriptions.on('message', function(channel, trackUri) {
  Spotify.retrieve(trackUri, function(error, track) {
    console.log("Redis current changed: ", track);
    io.sockets.emit('change-current', track );
  });
});

redis_subscriptions.subscribe('change-current');

config.asset_builder.register(ember_preprocessor);
server.listen(config.port);

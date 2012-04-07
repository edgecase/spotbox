var path    = require("path");
var redis   = require("redis");
var zmq     = require("zmq");
var cradle  = require("cradle");
var Spotbox = require(path.join(__dirname, "app", "lib", "spotbox"));


module.exports = function(config) {
  var env = process.env.APP_ENV || "development";

  var pub_addr              = "tcp://127.0.0.1:12000";
  var spotify_player_addr   = "tcp://127.0.0.1:12001";
  var airfoil_addr          = "tcp://127.0.0.1:12002";
  var pub_socket            = zmq.socket("pub");
  var spotify_player_socket = zmq.socket("sub");
  var airfoil_socket        = zmq.socket("sub");

  var database_name         = "spotbox_" + env;
  var connection            = new(cradle.Connection)("http://localhost", 5984, {cache: true});
  var db                    = connection.database(database_name);

  pub_socket.bindSync(pub_addr);

  db.exists(function(err, exists) {
    if (err) {
      console.log("Error connecting to database: ", err);
      throw err;
    } else if (!exists) {
      db.create(function(err, msg) { console.log("creating database", msg)});
    }
  });

  spotify_player_socket.connect(spotify_player_addr);
  spotify_player_socket.subscribe("");

  airfoil_socket.connect(airfoil_addr);
  airfoil_socket.subscribe(Spotbox.namespace("server::"));

  config.env                   = env;
  config.db                    = db;
  config.redis                 = redis.createClient();
  config.port                  = process.env.APP_PORT || 3000;
  config.root                  = path.normalize(path.join(__dirname));
  config.pub_socket            = pub_socket;
  config.spotify_player_socket = spotify_player_socket;
  config.airfoil_socket        = airfoil_socket;

  return config;
}({});

var path    = require("path");
var redis   = require("redis");
var zmq     = require("zmq");
var Spotbox = require(path.join(__dirname, "app", "lib", "spotbox"));


module.exports = function(config) {
  var pub_addr              = "tcp://127.0.0.1:12000";
  var spotify_player_addr   = "tcp://127.0.0.1:12001";
  var airfoil_addr          = "tcp://127.0.0.1:12002";
  var pub_socket            = zmq.socket("pub");
  var spotify_player_socket = zmq.socket("sub");
  var airfoil_socket        = zmq.socket("sub");

  pub_socket.bindSync(pub_addr);

  spotify_player_socket.connect(spotify_player_addr);
  spotify_player_socket.subscribe("");

  airfoil_socket.connect(airfoil_addr);
  airfoil_socket.subscribe(Spotbox.namespace("server::"));

  config.env                   = process.env.APP_ENV || "development";
  config.redis                 = redis.createClient();
  config.port                  = process.env.APP_PORT || 3000;
  config.root                  = path.normalize(path.join(__dirname));
  config.pub_socket            = pub_socket;
  config.spotify_player_socket = spotify_player_socket;
  config.airfoil_socket        = airfoil_socket;

  return config;
}({});

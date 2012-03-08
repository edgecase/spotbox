var path  = require("path");
var redis = require("redis");
var zmq   = require("zmq");

module.exports = function(config) {
  var controller_sub  = zmq.socket("sub");
  var pub             = zmq.socket("pub");
  var controller_addr = "tcp://127.0.0.1:12003";
  var pub_addr        = "tcp://127.0.0.1:12002";

  controller_sub.connect(sub_addr);
  pub.bindSync(pub_addr);
  controller_sub.subscribe(Spotbox.namespace("webapp"));

  config.env            = process.env.APP_ENV || "development";
  config.redis          = redis.createClient();
  config.port           = process.env.APP_PORT || 3000;
  config.root           = path.normalize(path.join(__dirname));
  config.controller_sub = controller_sub;
  config.pub            = pub;
  return config;
}({});

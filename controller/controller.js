var zmq = require("zmq");
var sub = zmq.socket("sub");
var pub = zmq.socket("pub");

var sub_addr = "tcp://127.0.0.1:12000";
var pub_addr = "tcp://127.0.0.1:12001";

sub.connect(sub_addr);
pub.bindSync(pub_addr);

sub.subscribe("");
sub.on("message", function(message) {
  console.log("message received: ", message.toString());
});

setTimeout(function() {
  console.log("send");
  pub.send("spotbox:players:spotify::play::spotify:track:18lwMD3frXxiVWBlztdijW");
}, 1000);

setTimeout(function() {
  console.log("send");
  pub.send("spotbox:players:spotify::stop");
  pub.send("spotbox:players:spotify::play::spotify:track:07KHJvlYBeQVqrmifTEqEp");
}, 10000);

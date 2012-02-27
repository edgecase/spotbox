var Activity = function() {};

Activity.build = function(socket, description) {
  var address = socket.handshake.address.address;
  var time = new Date();
  return {identifier: address, activity: description, time: time};
};

module.exports = Activity;

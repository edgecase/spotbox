var Spotbox = function() {};

Spotbox.namespace = function(str) {
  return "spotbox:" + str;
};

Spotbox.parse_message = function(msg) {
  var full_message = msg.toString().split("::");

  return {
      destination : full_message[0]
    , method      : full_message[1]
    , args        : full_message.slice(2)
  }
};

module.exports = Spotbox;

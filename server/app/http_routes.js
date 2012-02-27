var path          = require("path");
var config        = require(path.join(__dirname, "..", "config"));
var RequestHelper = require(path.join(config.root, "app", "lib", "request_helper"));


module.exports = function(server) {
  server.get("/", function(request, response) {
    RequestHelper.render(response, "main");
  });
};

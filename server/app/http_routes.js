var path          = require("path");
var config        = require(path.join(__dirname, "..", "config"));

module.exports = function(server) {
  server.get("/", function(request, response) {
    response.render("main");
  });
};

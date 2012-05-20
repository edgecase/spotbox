var path = require("path");
var app  = require(path.join(__dirname, "..", "config", "app"));

module.exports = function(server) {
  server.get("*", function(request, response) {
    response.render("main");
  });
};

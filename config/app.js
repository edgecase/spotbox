var path     = require("path");
var settings = require(path.join(__dirname, "settings"));

var env = process.env.APP_ENV || "development";
var port = process.env.APP_PORT || 3000;
var config = {
  env: env,
  settings: settings,
  port: port,
  root: path.normalize(path.join(__dirname, ".."))
};

module.exports = config;

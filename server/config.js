var path          = require("path");
var redis         = require("redis");

module.exports = function(app) {
  app.env  = process.env.APP_ENV || "development";
  app.redis= redis.createClient();
  app.port = process.env.APP_PORT || 3000;
  app.root = path.normalize(path.join(__dirname));
  return app;
}({});

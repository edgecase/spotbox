var path          = require("path");
var redis         = require("redis");
var asset_builder = require("asset_builder");


module.exports = function(app) {
  app.env  = process.env.APP_ENV || "development";
  app.redis= redis.createClient();
  app.port = process.env.APP_PORT || 3000;
  app.root = path.normalize(path.join(__dirname));
  app.asset_builder = asset_builder({
    src_root: path.join(app.root, "app", "assets"),
    dst_root: path.join(app.root, "public", "assets"),
    base_url: "/assets",
    env: app.env
  });
  return app;
}({});

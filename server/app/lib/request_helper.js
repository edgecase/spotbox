var fs         = require("fs");
var path       = require("path");
var underscore = require("underscore");
var fsutils    = require("fs_utils");
var config     = require(path.join(__dirname, "..", "..", "config"));

var RequestHelper = {};

RequestHelper.render = function(response, name, locals) {
  response.render(name, underscore.extend({link_helpers: config.asset_builder.helpers}, locals));
};

module.exports = RequestHelper;

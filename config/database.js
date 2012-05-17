var path      = require("path");
var mongodb   = require("mongodb");
var appConfig = require(path.join(__dirname, "app"));
var settings  = require(path.join(appConfig.root, "config", "settings"));

var dbName = "spotbox_" + appConfig.env;
var host   = settings.mongodb.host || "127.0.0.1";
var port   = settings.mongodb.port || 27017;
var server = new mongodb.Server(host, port, {});
var client =  mongodb.Db(dbName, server, {})

module.exports = client;

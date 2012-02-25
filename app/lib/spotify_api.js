var http        = require("http");
var path        = require("path");
var querystring = require("querystring");
var underscore  = require("underscore");
var config      = require(path.join(__dirname, "..", "..", "config"));

var settings = {
  host: "ws.spotify.com",
  version: 1
};

function request(opts, params, hollaback) {
  console.log("===================");
  console.log("spotify request: ", new Date(), ": ", opts, params);
  options = {};
  options.host = settings.host
  options.path = "/" + opts.type + "/" +  settings.version + "/"

  if (opts.searchType) {
    options.path += opts.searchType;
  }

  options.path += ".json";

  options.path += "?" + querystring.stringify(params);

  console.log(opts);
  console.log(options);
  console.log("===================");

  http.request(options, function(response) {
    var metadata = "";
    response.on("data", function(chunk) {
      metadata += chunk.toString();
    });
    response.on("end", function() {
      hollaback(null, metadata);
    });
    response.on("error", function(error) {
      hollaback(error);
    });
  }).end();
};

var SpotifyApi = function() {};

SpotifyApi.lookup = function(spotifyUri, hollaback) {
  var options = { type: "lookup" };
  var params  = { uri: spotifyUri };
  request(options, params, hollaback);
};

SpotifyApi.search = function(type, query, hollaback) {
  var options = {type: "search", searchType: type};
  var params = {q: query};
  request(options, params, hollaback);
};

module.exports = SpotifyApi;

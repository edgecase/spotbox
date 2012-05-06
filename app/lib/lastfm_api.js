var path        = require("path");
var http        = require("http");
var querystring = require("querystring");
var config      = require(path.join(__dirname, "..", "..", "config"));

var settings = {
  host: "ws.audioscrobbler.com",
  version: "2.0",
  api_key: config.settings.lastfm.api_key
};

// Only grabbing artwork at the moment, for more information
// on what is available from the last.fm api visit www.last.fm/api
//
function parsedData(metadata) {
  var data    = JSON.parse(metadata);
  var album   = data.album
  var artwork = album && album.image || [];
  return { artwork: artwork };
}

function request(params, hollaback) {
  var options  = {};
  options.host = settings.host;
  options.path = "/" + settings.version + "/"

  params["format"]  = "json";
  params["api_key"] = settings["api_key"];
  options.path += "?" + querystring.stringify(params);

  http.request(options, function(response) {
    var metadata = "";
    response.on("data", function(chunk) {
      metadata += chunk.toString();
    });
    response.on("end", function() {
      hollaback(null, parsedData(metadata));
    });
    response.on("error", function(error) {
      hollaback(error);
    });
  }).end();
};

var LastFmApi = function() {};

LastFmApi.albumInfo = function(artist, album, hollaback) {
  var params = {
    method: "album.getinfo",
    artist: artist,
    album:  album,
  };
  request(params, hollaback);
};

module.exports = LastFmApi;

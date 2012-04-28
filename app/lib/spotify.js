var path                  = require("path");
var http                  = require("http");
var querystring           = require("querystring");
var underscore            = require("underscore");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotbox               = require(path.join(config.root, "app", "lib", "spotbox"));
var SpotifyApi            = require(path.join(config.root, "app", "lib", "spotify_api"));

function cache(spotify_id, metadata) {
  config.redis.set(Spotbox.namespace(spotify_id), metadata);
};

function standardize_track(sp_track) {
  var track            = {album: {}};
  track.type           = "track";
  track.provider       = "spotify";
  track.id             = sp_track.href;
  track.name           = sp_track.name;
  track.track_number   = sp_track["track-number"];
  track.length         = sp_track.length;
  track.album.name     = sp_track.album.name;
  track.album.id       = sp_track.album.href;
  track.album.released = sp_track.album.released;

  track.ids = underscore.reduce(sp_track["external-ids"], function(memo, ext_id) {
    memo[ext_id.type] = ext_id.id;
    return memo;
  }, {spotify: track.id});

  track.artists = underscore.map(sp_track.artists, function(artist) {
    return {name: artist.name, id: artist.href};
  });

  return track;
};


var Spotify = function() {};

Spotify.retrieve = function(spotify_id, hollaback) {
  config.redis.get(Spotbox.namespace(spotify_id), function(error, metadata) {
    if (error) {
      hollaback(error);
    } else if (metadata) {
      hollaback(null, JSON.parse(metadata));
    } else {
      SpotifyApi.lookup(spotify_id, function(error, metadata) {
        if (error) {
          hollaback(error);
        } else {
          try {
            var track = standardize_track(JSON.parse(metadata).track);
            cache(spotify_id, JSON.stringify(track));
            hollaback(null, track);
          } catch(e) {
            console.log(e);
            hollaback({error: true});
          }
        }
      });
    }
  });
};

Spotify.search = function(query, hollaback) {
  var redis_key = Spotbox.namespace("search:" + querystring.escape(query));
  config.redis.get(redis_key, function(error, metadata) {
    if (metadata) {
      hollaback(error, JSON.parse(metadata));
    } else {
      SpotifyApi.search("track", query, function(error, metadata) {
        if (error) {
          hollaback(error);
        } else {
          try {
            var tracks = underscore.map(JSON.parse(metadata).tracks, function(track) {
              // Availability check is relatively expensive, decentralize the work by pushing that to the client.
              return underscore.extend(standardize_track(track), {availability: track.album.availability});
            });
            config.redis.set(redis_key, JSON.stringify(tracks));
            config.redis.expire(redis_key, 3600 * 24 * 7);
            hollaback(null, tracks);
          } catch(e) {
            console.log(e);
            hollaback({error: true});
          }
        }
      });
    }
  });
};

module.exports = Spotify;

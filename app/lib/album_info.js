var path      = require("path");
var config    = require(path.join(__dirname, "..", "..", "config"));
var Spotbox   = require(path.join(config.root, "app", "lib", "spotbox"));
var LastFmApi = require(path.join(config.root, "app", "lib", "lastfm_api"));

function redisKey(spotify_album_id) {
  return Spotbox.namespace("album_info:" + spotify_album_id);
};

function cache(key, metadata) {
  config.redis.set(key, metadata);
  config.redis.expire(key, 3600 * 24 * 7);
};


// Currently only grabbing artwork
//
function trackWithAdditionalAlbumInfo(track, albumInfo) {
  track.album.artwork = albumInfo.artwork;
  return track;
}

var AlbumInfo = function() {};

AlbumInfo.retrieve = function(track, hollaback) {
  var artist   = track.artists[0].name;
  var album    = track.album.name;
  var album_id = track.album.id;
  var key      = redisKey(album_id);
  var albumInfo;

  config.redis.get(key, function(error, cached_metadata) {
    if (error) {
      hollaback(error);
    } else if (cached_metadata) {
      var albumInfo = JSON.parse(cached_metadata);
      hollaback(error, trackWithAdditionalAlbumInfo(track, albumInfo));
    } else {
      try {
        LastFmApi.albumInfo(artist, album, function(error, metadata) {
          if (error) {
            hollaback(error, {});
          } else {
            cache(key, JSON.stringify(metadata));
            hollaback(null, trackWithAdditionalAlbumInfo(track, metadata));
          }
        });
      } catch(e) {
        console.log(e);
        hollaback({error: true});
      }
    }
  });
};

module.exports = AlbumInfo;

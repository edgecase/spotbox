var path                  = require("path");
var underscore            = require("underscore");
var AsyncCollectionRunner = require("async_collection_runner");
var config                = require(path.join(__dirname, "..", "..", "config"));
var Spotify               = require(path.join(config.root, "app", "lib", "spotify"));

var Stats = function() {};

function get_top(view_name, hollaback) {
  options = {group: true};
  config.db.view(view_name, options, function(error, results) {
    if (error) {
      hollback(error)
    } else {
      var top = underscore.sortBy(results, function(el) {
        return el.value;
      }).reverse().slice(0, 20);
      hollaback(null, top);
    }
  });
}

function top_tracks(view_name, hollaback) {
  get_top(view_name, function(error, results) {
    if (error) {
      hollaback(error);
    } else {
      var runner = new AsyncCollectionRunner(results, function(element, hollaback) {
        Spotify.retrieve(element.key, hollaback)
      });
      runner.run(function(errors, tracks) {
        if (errors) {
          hollaback(errors)
        } else {
          var top_tracks = underscore.map(tracks, function(el, idx) {
            el.count = results[idx].value
            return el;
          });
          hollaback(null, top_tracks);;
        }
      });
    }
  });
};

Stats.top_played = function(hollaback) {
  top_tracks("played_tracks/top", hollaback);
};

Stats.top_skipped = function(hollaback) {
  top_tracks("skipped_tracks/top", hollaback);
};

Stats.top_artists = function(hollaback) {
  get_top("played_tracks/top_artists", function(error, results) {
    if (error) {
      hollaback(error);
    } else {
      var artists = underscore.map(results, function(el) {
        return {name: el.key, count: el.value};
      });
      hollaback(null, artists);
    }
  });
};

module.exports = Stats;

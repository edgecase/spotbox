var design = {
  _id:      "played_tracks",
  language: "javascript"
};

design.views = {
  recent: {
    map: function(doc) {
      if (doc.type === "played_track") {
        emit(doc.created_at, doc);
      }
    }
  },

  top: {
    map: function(doc) {
      if (doc.type === "played_track") {
        emit(doc.id, 1);
      }
    },

    reduce: function(keys, values, rereduce) {
      return sum(values);
    }
  },

  top_artists: {
    map: function(doc) {
      if (doc.type === "played_track") {
        doc.artists.forEach(function(artist) {
          emit(artist.name, 1);
        });
      }
    },

    reduce: function(keys, values, rereduce) {
      return sum(values);
    }
  }
};

module.exports = design;

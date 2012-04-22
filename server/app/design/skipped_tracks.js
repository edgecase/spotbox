var design = {
  _id:      "skipped_tracks",
  language: "javascript"
};

design.views = {
  top: {
    map: function(doc) {
      if (doc.type === "skipped_track") {
        emit(doc.id, 1);
      }
    },

    reduce: function(keys, values, rereduce) {
      return sum(values);
    }
  }
};

module.exports = design;

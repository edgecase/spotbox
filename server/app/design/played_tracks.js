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
  }
};

module.exports = design;

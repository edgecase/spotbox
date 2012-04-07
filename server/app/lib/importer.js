var fs         = require("fs");
var path       = require("path");
var underscore = require("underscore");

module.exports = function(app) {
  function save(doc) {
    app.db.save("_design/" + doc._id, doc);
  };

  var design_directory = path.join(app.root, "app", "design");
  fs.readdir(design_directory, function(err, files) {
    var design_documents = underscore.map(files, function(file) {
      return require(path.join(design_directory, file));
    });

    underscore.each(design_documents, function(document) {
      save(document)
    });
  });
};

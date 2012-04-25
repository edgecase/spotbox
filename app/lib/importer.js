var fs         = require("fs");
var path       = require("path");
var config     = require(path.join(__dirname, "..", "..", "config"));
var underscore = require("underscore");

module.exports = function() {
  function save(doc) {
    config.db.save("_design/" + doc._id, doc);
  };

  var design_directory = path.join(config.root, "app", "design");
  fs.readdir(design_directory, function(err, files) {
    var design_documents = underscore.map(files, function(file) {
      return require(path.join(design_directory, file));
    });

    underscore.each(design_documents, function(document) {
      save(document)
    });
  });
};

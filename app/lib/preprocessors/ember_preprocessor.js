var path               = require("path");
var fs                 = require("fs");
var vm                 = require("vm");
var app                = require(path.join(__dirname, "..", "..", "..", "config", "app"));
var ember_path         = path.join(app.root, "app", "assets", "javascripts", "lib", "ember.js");
var ember_context_path = path.join(app.root, "app", "lib", "preprocessors", "ember_context.js");
var handlebars_path    = path.join(app.root, "app", "assets", "javascripts", "lib", "handlebars.js");

function create_context() {
  var context = vm.createContext({});
  vm.runInContext(fs.readFileSync(ember_context_path, "utf8"), context);
  vm.runInContext(fs.readFileSync(handlebars_path, "utf8"), context);
  vm.runInContext(fs.readFileSync(ember_path, "utf8"), context);
  return context;
};

var context = create_context();

module.exports = {
  ext: "hbs",
  preprocessor: function(data, filepath, hollaback) {
    var filename = path.basename(filepath, ".hbs");
    var hbars = "Ember.TEMPLATES." + filename + " = Ember.Handlebars.template(";
    try {
      hbars += context.Ember.Handlebars.precompile(data).toString();
      hbars += ")";
      hollaback(null, hbars);
    } catch (error) {
      console.log("error compiling handlebar template: ", filename);
      hollaback(error);
    }
  }
};

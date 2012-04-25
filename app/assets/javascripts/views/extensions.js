Spotbox.Views.Button = Ember.Button.extend({
  classNames: ["btn"],
  classNameBindings: ["active", "primary:btn-primary"]
});

Spotbox.Views.SubmitButton = Spotbox.Views.Button.extend({
  classNames: ["btn", "btn-primary"],
  click: function(event) {
    var self = this;
    this.set("disabled", true)
    this.get("parentView").submit(function() {
      self.set("disabled", false);
    });
  }
});

Spotbox.Views.TextField = Ember.TextField.extend({
  insertNewline: function(event) {
    event.preventDefault();
    this.get('parentView').submit(function(){});
  }
});

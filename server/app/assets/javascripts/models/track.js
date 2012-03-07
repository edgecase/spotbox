Spotbox.Models.Track = Ember.Object.extend({
  progress: 0,
  percent: function() {
    var length = this.get("length");
    return this.get("progress") / length * 100;
  }.property("progress")
});

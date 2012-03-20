Spotbox.Views.PlaylistEntry = Ember.View.extend({
  tagName: 'li',

  isVisible: function() {
    var prefix = Spotbox.Controllers.Playlists.get("prefix");
    if (prefix.length === 0) {
      return true;
    } else {
      return new RegExp("^" +prefix, "i").test(this.getPath('content.name'));
    }
  }.property('Spotbox.Controllers.Playlists.prefix')

})

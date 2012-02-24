window.Spotbox = Ember.Application.create({
  ready: function() {
    Spotbox.Controllers.CurrentlyPlaying.init();
    Spotbox.Views.Layout.create().append();
  }

});

// Namespaces
Spotbox.Views = {};
Spotbox.Models = {};
Spotbox.Controllers = {};
Spotbox.socket = io.connect('http://localhost');

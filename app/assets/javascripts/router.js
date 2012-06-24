Spotbox.Router = Ember.Router.extend({
  location: 'hash',
  enableLogging: true,
  root: Ember.Route.extend({
    index: Ember.Route.extend({
      route: "/",
      connectOutlets: function(router) {
        router.transitionTo("queue");
      }
    }),
    queue: Ember.Route.extend({
      route: "/queue",
      connectOutlets: function(router) {
        router.get("applicationController").connectOutlet("queuedTracks");
      }
    })
  })
});

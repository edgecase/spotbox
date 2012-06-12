// Miscellaneous things

// Mixin underscore string
_.mixin(_.str.exports());

page("/", function(ctx) {
  ctx.save();
  Spotbox.TabManager.transitionTo("queue");
});

page("/search", function(ctx) {
  ctx.save();
  Spotbox.TabManager.transitionTo("search");
});

page("/uploads", function(ctx) {
  ctx.save();
  Spotbox.TabManager.transitionTo("uploads");
  Spotbox.Controllers.Uploads.retrieve();
});

page("*", function(ctx) {
  console.log("not found");
});


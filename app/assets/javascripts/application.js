// Miscellaneous things

// Mixin underscore string
_.mixin(_.str.exports());

page("/", function(ctx) {
  ctx.save();
  Spotbox.TabManager.goToState("queue")
});

page("/search", function(ctx) {
  ctx.save();
  Spotbox.TabManager.goToState("search")
});

page("/uploads", function(ctx) {
  ctx.save();
  Spotbox.TabManager.goToState("uploads")
  Spotbox.Controllers.Uploads.retrieve();
});

page("*", function(ctx) {
  console.log("not found");
});


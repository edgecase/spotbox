var RateLimiter = function(minDelta) {
  this.lastCall = new Date();
  this.minDelta = minDelta;
  this.fnQueue = [];
  this.tickInterval = null;
};

RateLimiter.prototype.queue = function(hollaback) {
  this.fnQueue.push(hollaback);
  if (!this.tickInterval) {
    var self = this;
    this.tickInterval = setInterval(function() { self.tick() }, this.minDelta);
  }
  // tick immediately as well
  this.tick();
};

RateLimiter.prototype.tick = function() {
  var now = new Date();
  var delta = now - this.lastCall;
  var run = false;

  if (this.fnQueue.length === 0) {
    // stop ticking
    clearInterval(this.tickInterval);
    this.tickInterval = null;
  } else {
    if (delta >= this.minDelta) {
      run = true;
      this.lastCall = now
      var fn = this.fnQueue.shift();
      fn();
    }
  }
  return run;
};

module.exports = RateLimiter;

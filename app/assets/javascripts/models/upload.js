Spotbox.Models.Upload = Ember.Object.extend({
  file: null,
  status: "active",

  upload: function(hollaback) {
    var self = this;
    var file = this.get("file");
    var url = "/tracks/";
    var xhr = new XMLHttpRequest();
    var data = new FormData;
    data.append("track", file);
    xhr.open("POST", url, true);
    xhr.upload.addEventListener("progress", function(event) { self.progress(event)});
    xhr.onreadystatechange = function(event) { self.updateStatus(event, hollaback) };
    xhr.send(data);
  },

  updateStatus: function(event, hollaback) {
    var info = event.target;
    if (info.status && info.status !== 200) {
      this.set("status", "error");
    }

    if (info.readyState === 4) {
      if (info.status === 200) {
        this.set("percent", 100);
        this.set("status", "success");
        hollaback(JSON.parse(info.response));
      }
    }
  },

  progress: function(event) {
    var percent = parseInt(event.loaded / event.total * 100);
    this.set("percent", percent);
  }
});

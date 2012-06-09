module.exports = {
  session: {
    secret: "sekrit"
  },

  google_auth: {
    app_id: "12345.apps.googleusercontent.com",
    app_secret: "12345",
    domain: "theedgecase.com"
  },

  lastfm: {
    api_key: "12345"
  },

  acoustid: {
    api_key: "12345"
  },

  airfoil: {
    volume: 35,
    speaker_name: "Computer"
  },

  mongodb: {
    host: "",
    port: ""
  },

  // user to use in development instead of actually hitting google auth
  user: {
    email: "foo@theedgecase.com"
  }
}

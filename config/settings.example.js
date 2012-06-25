module.exports = {
  session: {
    secret: "sekrit"
  },

  google_auth: {
    clientID: "12345.apps.googleusercontent.com",
    clientSecret: "12345",
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
    id: "123456789012345678901",
    email: "tappy@theedgecase.com",
    verified_email: true,
    name: "Tappy Cardinal",
    given_name: "Tappy",
    family_name: "Cardinal"
  }
};

require "bundler"
require "json"
require "logger"
require "securerandom"
require "./spotbox"
require "./spotbox_player"
Bundler.require

spotify = YAML.load_file("config.yml")["spotify"]
session = Hallon::Session.initialize IO.read(spotify["appkey"]) do
  on(:connection_error) do |error|
    Hallon::Error.maybe_raise(error)
  end

  on(:logged_out) do
    abort "[FAIL] Logged out!"
  end
end

redis = Redis.new
session.login!(spotify["username"], spotify["password"])
spotbox = Spotbox.new(session, redis)
spotbox.export_playlists
SpotboxPlayer.new(session, redis).play

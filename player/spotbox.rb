class Spotbox
  attr_reader :session, :redis, :logger

  # Unfortunately spotify does not actually delete playlists.
  # Hardcode the ones you want to be selectable.
  PLAYLISTS = [
    "spotify:user:felixflores:playlist:69OIU8YTz5g9XzKKv53vlg",
    "spotify:user:mikedoel:playlist:05m1Zj1ixCNoCb3kJd5of7",
  ]

  def initialize(session, redis)
    @session = session
    @redis = redis
    @logger = Logger.new(STDOUT)
  end

  def namespace(str)
    "spotbox:#{str}"
  end

  def export_playlists
    playlists_key = namespace("playlists")
    redis.del(playlists_key)

    session.container.load
    playlists = PLAYLISTS.map do |uri|
      playlist = Hallon::Playlist.new(uri)
      playlist.load
      logger.debug "exporting playist #{playlist.name}"
      playlist_key = namespace(playlist.to_str)
      redis.rpush(playlists_key, playlist.to_str)
      redis.set(playlist_key, JSON.generate({name: playlist.name}))
      playlist
    end
    redis.set(namespace("current_playlist"), playlists.first.to_str)
  end
end

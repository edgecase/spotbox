class SpotboxPlayer
  attr_reader :session, :redis, :player, :playlist, :logger, :status, :recently_played
  def initialize(session, redis)
    @session = session
    @redis = redis
    @player = Hallon::Player.new(session, Hallon::OpenAL)
    @logger = Logger.new(STDOUT)
    @recently_played = []
  end

  def play
    next_track
    setup_redis_bindings #this method never returns
  end

  private

  def namespace(str)
    "spotbox:#{str}"
  end

  def setup_redis_bindings
    session.on :end_of_track do
      trigger_next_track
    end

    session.on :stop_playback do
      report_played
    end

    Redis.new.subscribe(namespace("player")) do |on|
      on.message do |channel, msg|
        if msg == "next"
          next_track
        elsif msg == "stop"
          player.pause
          clear_current
        elsif msg == "play"
          next_track if player.status == :paused
        end
      end
    end
  end

  def trigger_next_track
    redis.publish namespace("player"), "next"
  end

  def clear_current
    redis.del namespace("current_track")
  end

  def report_played
    track = recently_played.shift
    if track
      redis.lpush namespace("recently_played"), track.to_str
      redis.publish namespace("current_track_change"), nil
    end
  end

  def next_track
    if tracks_queued?
      play_queued
    else
      play_random
    end
  end

  def tracks_queued?
    redis.llen(namespace("play_queue")) > 0
  end

  def play_queued
    logger.debug "playing from queue"
    uri = redis.lpop namespace("play_queue")
    play_track Hallon::Track.new(uri)
  end

  def play_random
    playlist_uri = redis.get(namespace("current_playlist"))
    if playlist.nil? || playlist_uri != playlist.to_str
      @playlist = Hallon::Playlist.new(playlist_uri)
      playlist.load
    end
    logger.debug "playing random from playlist #{playlist.name}"
    num = SecureRandom.random_number playlist.size
    track = playlist.tracks[num]
    play_track track
  end

  def can_play?(track)
    !track.local? && track.availability == :available
  end

  def play_track(track)
    track.load
    if can_play? track
      recently_played.push(track)
      logger.debug "playing #{track.name}"
      redis.set namespace("current_track"), track.to_str
      redis.publish namespace("current_track_change"), nil
      player.play(track)
    else
      logger.debug "skipping unavailable #{track.name}"
      next_track
    end
  end
end

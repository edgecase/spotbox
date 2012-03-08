/**
 * Copyright (c) 2006-2010 Spotify Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *
 * This example application is the most minimal way to just play a spotify URI.
 *
 * This file is part of the libspotify examples suite.
 */

#include <errno.h>
#include <libgen.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/time.h>
#include <zmq.h>
#include <stdbool.h>

#include <libspotify/api.h>

#include "audio.h"
#include "config.h"


/* --- Data --- */
/// The application key is specific to each project, and allows Spotify
/// to produce statistics on how our service is used.
extern const uint8_t g_appkey[];
/// The size of the application key.
extern const size_t g_appkey_size;

/// The output queue for audo data
static audio_fifo_t g_audiofifo;
/// Synchronization mutex for the main thread
static pthread_mutex_t g_notify_mutex;
/// Synchronization condition variable for the main thread
static pthread_cond_t g_notify_cond;
/// The global session handle
static sp_session *g_sess;
/// Handle to the current track
static sp_track *g_currenttrack;

static void *g_zmq_pub;
static void *g_zmq_sub;
static double g_progress;
static bool g_playback_done;
static pthread_mutex_t g_progress_mutex;

enum status {
   PLAY,
   STOP,
   PAUSE
};

static enum status playstatus = STOP;
void zmq_send_message (void *socket, char *string);
void unload_current_track();
void play_current_track();

/* ---------------------------  SESSION CALLBACKS  ------------------------- */
/**
 * This callback is called when an attempt to login has succeeded or failed.
 *
 * @sa sp_session_callbacks#logged_in
 */
static void logged_in(sp_session *sess, sp_error error) {
  if (error == SP_ERROR_OK) {
    printf("logged in\n");
  } else {
    printf("login failure");
  }
}

/**
 * Callback called when libspotify has new metadata available
 *
 * @sa sp_session_callbacks#metadata_updated
 */
static void metadata_updated(sp_session *sess) {
  if (sp_track_error(g_currenttrack) != SP_ERROR_OK) {
    return;
  }
  playstatus = PLAY;
  sp_session_player_load(g_sess, g_currenttrack);
  sp_session_player_play(g_sess, 1);
}

/**
 * This callback is called from an internal libspotify thread to ask
 * us to reiterate the main loop.
 *
 * We notify the main thread using a condition variable and a protected variable.
 *
 * @sa sp_session_callbacks#notify_main_thread
 */
static void notify_main_thread(sp_session *sess) {
  pthread_mutex_lock(&g_notify_mutex);
  pthread_cond_signal(&g_notify_cond);
  pthread_mutex_unlock(&g_notify_mutex);
}

/**
 * This callback is used from libspotify whenever there is PCM data available.
 *
 * @sa sp_session_callbacks#music_delivery
 */
static int music_delivery(sp_session *sess, const sp_audioformat *format, const void *frames, int num_frames) {
  audio_fifo_t *af = &g_audiofifo;
  audio_fifo_data_t *afd;
  size_t s;

  if (num_frames == 0)
    return 0; // Audio discontinuity, do nothing

  pthread_mutex_lock(&af->mutex);

  /* Buffer one second of audio */
  if (af->qlen > format->sample_rate) {
    pthread_mutex_unlock(&af->mutex);

    return 0;
  }

  pthread_mutex_lock(&g_progress_mutex);
  g_progress += num_frames / (double) format->sample_rate;
  pthread_mutex_unlock(&g_progress_mutex);

  s = num_frames * sizeof(int16_t) * format->channels;

  afd = malloc(sizeof(audio_fifo_data_t) + s);
  memcpy(afd->samples, frames, s);

  afd->nsamples = num_frames;

  afd->rate = format->sample_rate;
  afd->channels = format->channels;

  TAILQ_INSERT_TAIL(&af->q, afd, link);
  af->qlen += num_frames;

  pthread_cond_signal(&af->cond);
  pthread_mutex_unlock(&af->mutex);

  return num_frames;
}


/**
 * This callback is used from libspotify when the current track has ended
 *
 * @sa sp_session_callbacks#end_of_track
 */
static void end_of_track(sp_session *sess) {
  pthread_mutex_lock(&g_notify_mutex);
  g_playback_done = true;
  pthread_cond_signal(&g_notify_cond);
  pthread_mutex_unlock(&g_notify_mutex);
}

/**
 * Notification that some other connection has started playing on this account.
 * Playback has been stopped.
 *
 * @sa sp_session_callbacks#play_token_lost
 */
static void play_token_lost(sp_session *sess) {
  puts("Play token lost");
  audio_fifo_flush(&g_audiofifo);
  unload_current_track();
}

static void log_message(sp_session *session, const char *msg) {
  puts(msg);
}

/**
 * The session callbacks
 */
static sp_session_callbacks session_callbacks = {
  .logged_in = &logged_in,
  .notify_main_thread = &notify_main_thread,
  .music_delivery = &music_delivery,
  .metadata_updated = &metadata_updated,
  .play_token_lost = &play_token_lost,
  .log_message = &log_message,
  .end_of_track = &end_of_track,
};

/**
 * The session configuration. Note that application_key_size is an
 * external, so we set it in main() instead.
 */
static sp_session_config spconfig = {
  .api_version = SPOTIFY_API_VERSION,
  .cache_location = "tmp",
  .settings_location = "tmp",
  .application_key = g_appkey,
  .application_key_size = 0, // Set in main()
  .user_agent = "spotify-player",
  .callbacks = &session_callbacks,
  NULL,
};
/* -------------------------  END SESSION CALLBACKS  ----------------------- */

void zmq_send_message (void *socket, char *string) {
  char *namespace = "spotbox:controller::";
  char namespaced_msg[strlen(string) + 1 + strlen(namespace)];
  strcpy(namespaced_msg, namespace);
  strcpy(&namespaced_msg[strlen(namespaced_msg)], string);

  zmq_msg_t message;
  zmq_msg_init_size (&message, strlen(namespaced_msg));
  memcpy (zmq_msg_data (&message), namespaced_msg, strlen(namespaced_msg));
  zmq_send (socket, &message, 0);
  zmq_msg_close (&message);
}

void unload_current_track() {
  playstatus = STOP;
  if (g_currenttrack) {
    sp_track_release(g_currenttrack);
    g_currenttrack = NULL;
    sp_session_player_unload(g_sess);
  }
  audio_fifo_flush(&g_audiofifo);
  audio_init(&g_audiofifo);
}

void track_ended() {
  unload_current_track();
  zmq_send_message(g_zmq_pub, "stopped");
}

void status_update() {
  // should this do something when not playing?
  // IE an idle status update?
  char time[256];
  char url[256];
  char msg[512];
  sp_link *track_link = sp_link_create_from_track(g_currenttrack, 0);
  sp_link_as_string(track_link, url, sizeof(url));
  sp_link_release(track_link);

  sprintf(time, "%.1lf", g_progress);

  strcpy(msg, "playing::");
  strcpy(&msg[strlen(msg)], url);
  strcpy(&msg[strlen(msg)], "::");
  strcpy(&msg[strlen(msg)], time);
  zmq_send_message(g_zmq_pub, msg);
}

void stop_track() {
  unload_current_track();
  zmq_send_message(g_zmq_pub, "stopped");
}

void pause_track() {
  if (playstatus == PLAY) {
    playstatus = PAUSE;
    sp_session_player_unload(g_sess);
    audio_fifo_flush(&g_audiofifo);
    audio_init(&g_audiofifo);
  }
}

void unpause_track() {
  if (playstatus == PAUSE) {
    play_current_track();
    sp_session_player_seek(g_sess, g_progress * 1000.0);
  }
}

void play_current_track() {
  if (playstatus != PLAY) {
    if (sp_track_error(g_currenttrack) == SP_ERROR_OK) {
      sp_session_player_load(g_sess, g_currenttrack);
      sp_session_player_play(g_sess, 1);
      playstatus = PLAY;
    }
  }
}

void play_track(char *trackuri) {
  if (playstatus != PLAY) {
    if (g_currenttrack) {
      unload_current_track();
    }

    sp_link *link;
    link = sp_link_create_from_string(trackuri);
    sp_track_add_ref(g_currenttrack = sp_link_as_track(link));
    sp_link_release(link);

    pthread_mutex_lock(&g_progress_mutex);
    g_progress = 0;
    pthread_mutex_unlock(&g_progress_mutex);

    play_current_track();
  }
}

void dispatch(char *message) {
  if (strncmp(message, "play::", 6) == 0) {
    play_track(&message[6]);
  } else if (strncmp(message, "stop", 4) == 0) {
    stop_track();
  } else if (strncmp(message, "pause", 5) == 0) {
    pause_track();
  } else if (strncmp(message, "unpause", 7) == 0) {
    unpause_track();
  }
}

void receive_messages() {
  bool continue_receiving = true;
  while(continue_receiving) {
    zmq_msg_t message;
    zmq_msg_init (&message);
    int recv_status = zmq_recv (g_zmq_sub, &message, ZMQ_NOBLOCK);
    if (recv_status == -1) {
      continue_receiving = false;
    } else {
      int size = zmq_msg_size (&message);
      char string[size + 1];
      memcpy (string, zmq_msg_data (&message), size);
      string [size] = 0;
      dispatch(&string[25]);
    }
    zmq_msg_close (&message);
  }
}

void playloop () {
  int next_timeout = 0;
  struct timespec ts;

  for (;;) {
#if _POSIX_TIMERS > 0
    clock_gettime(CLOCK_REALTIME, &ts);
#else
    struct timeval tv;
    gettimeofday(&tv, NULL);
    TIMEVAL_TO_TIMESPEC(&tv, &ts);
#endif
    ts.tv_nsec += (long) 250 * 1000000;
    if (ts.tv_nsec >= 1000000000 ) {
      ts.tv_nsec %=   1000000000;
      ts.tv_sec++;
    }
    pthread_cond_timedwait(&g_notify_cond, &g_notify_mutex, &ts);
    pthread_mutex_unlock(&g_notify_mutex);

    // Start doing stuff in the main thread
    receive_messages();

    if (g_playback_done) {
      track_ended();
      g_playback_done = false;
    }

    if (g_currenttrack) {
      status_update();
    }
    // Stop doing stuff in the main thread
    do {
      sp_session_process_events(g_sess, &next_timeout);
    } while (next_timeout == 0);

    pthread_mutex_lock(&g_notify_mutex);
  }
}

int main(int argc, char **argv) {
  sp_error err;
  audio_init(&g_audiofifo);

  /* Create session */
  spconfig.application_key_size = g_appkey_size;
  err = sp_session_create(&spconfig, &g_sess);

  if (SP_ERROR_OK != err) {
    fprintf(stderr, "Unable to create session: %s\n", sp_error_message(err));
    exit(1);
  }

  pthread_mutex_init(&g_notify_mutex, NULL);
  pthread_mutex_init(&g_progress_mutex, NULL);
  pthread_cond_init(&g_notify_cond, NULL);

  sp_session_login(g_sess, SPOTIFY_USERNAME, SPOTIFY_PASSWORD, 0);
  pthread_mutex_lock(&g_notify_mutex);

  void *context = zmq_init(1);
  g_zmq_sub = zmq_socket(context, ZMQ_SUB);
  g_zmq_pub = zmq_socket(context, ZMQ_PUB);
  zmq_connect(g_zmq_sub, "tcp://127.0.0.1:12000");
  zmq_bind(g_zmq_pub, "tcp://127.0.0.1:12001");
  zmq_setsockopt (g_zmq_sub, ZMQ_SUBSCRIBE, "spotbox:players:spotify::", 0);
  playloop();
  zmq_close(g_zmq_pub);
  zmq_close(g_zmq_sub);
  zmq_term(context);
  return 0;
}

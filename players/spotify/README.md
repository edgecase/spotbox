# Spotbox!

Spotbox is your company's juke box.

Wiggle Wiggle!

## Limitations

Currently spotbox only supports a spotify player.

## Players

### Spotify

The spotify player uses libspotify to play music from the Spotify music service.

#### Getting Spotify Credentials

In order to use the spotify API, you're going to need to have access to
a Premium Spotify account. Pony up, cheap ass.

#### Create API Config File

Write your spotify username/password to `config.h` as follows:

```c
#define SPOTIFY_USERNAME "XXXXXXXXX"
#define SPOTIFY_PASSWORD "XXXXXXXXX"
```

#### Create App Key

Upon logging in with your username/password, browse to `https://developer.spotify.com/en/libspotify/application-key/`.
Download your appkey as C code and write it to `appkey.c`.

#### Getting the Packages w/ Homebrew

##### Install libspotify

Install the libspotify package using `brew install libspotify`

##### Install libzmq

Install the libzmq package using `brew install libzmq`


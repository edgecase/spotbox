# Spotbox

Spotbox is the official jukebox of the [EdgeCase](http://edgecase.com) lab; 100% music democracy.

Gone are the days of fighting over airfoil, adding to a central database, and putting up with the songs no one wants to hear.
Others have tried, Spotbox will prevail.

![](http://i.imgur.com/wotR9.png)


## What Spotbox Does

Spotbox is a web jukebox that allows users to collectively control the music in your office.
Under the covers it uses [Spotify](http://spotify.com) to stream audio, so there is no need to manage a shared music collection.

Simply boot the app, select your favorite playlist, and Spotbox will randomly play from that playlist.
You can also search for songs and add them to the play queue.
If there are songs in the play queue, Spotbox will pull from the queue instead of the playlist.

If a song is playing that you don't like, you can click next.
If enough people click next, Spotbox will skip the current song.

Spotbox keeps track of what you have played, showing recently played songs as well as favorite songs and artists.

Spotbox also controls the airfoil connection and volume through the web interface.


## Requirements

* Node
* Zmq
* Redis
* Couchdb


## Setup

In order to use Spotbox, you'll need a Spotify appkey (requires Spotify premium account).
Pony up, cheap ass.

Spotbox has two components, the player and the web server.

### Player

* Download the player [here](https://github.com/downloads/edgecase/cocoa_spotify/cocoa_spotbox_driver)
* `chmod +x cocoa_spotbox_driver`
* `./cocoa_spotbox_driver ~/path/to/appkey.key USERNAME PASSWORD`

### Server

* Clone this repo
* `cd spotbox`
* `npm install`
* `node airfoil`
* `APP_PORT=9000 APP_ENV=production node server`

The production environment minifies assets and requires a quorem to skip tracks.
The development environment serves unminified assets and requires only one vote to skip.


## Screenshots

Queue
![](http://i.imgur.com/wotR9.png)

Search
![](http://i.imgur.com/KxlMZ.png)

Recent
![](http://i.imgur.com/a95ba.png)

Stats
![](http://i.imgur.com/qNYGC.png)

Playlists
![](http://i.imgur.com/Z5k2E.png)


## Contributing
Fork the project, make your fix, run the test suite, and make a pull request.


## License

MIT, see the LICENSE file.

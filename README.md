pi-music
==

Google Play Music on Raspberry Pi

Enjoy all your Google play music library, played by your pi, remotely controlled through a nice responsive web interface.

**Albums**
![albums screenshot][1]
**Artists**
![artists screenshot][2]
**Songs**
![songs screenshot][3]

Dependecies installation

>sudo apt-get install mpd mpc python-mpd python-pip screen git
>sudo pip install Flask
>sudo pip install gmusicapi

Installation and configuration
>git clone https://github.com/glutamatt/pi-music.git
>cd pi-music
>mkdir assets/api
>cp config.example.py config.py

Edit the file config.py : email and password ( device will be setted later on)

Run once the server
>python server.py

From server output, retrieve u'id': u'0x1a2b3c4e5f' to correctly fill the device value into config.py file
Stop and restart the server


  [1]: https://raw.github.com/glutamatt/pi-music/master/.screenshots/albums.png
  [2]: https://raw.github.com/glutamatt/pi-music/master/.screenshots/artists.png
  [3]: https://raw.github.com/glutamatt/pi-music/master/.screenshots/songs.png
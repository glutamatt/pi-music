from flask import Flask
import json
import mpd
import config
from gmusicapi import Mobileclient
from flask import send_file

def get_conf():
    global config
    return config

api = Mobileclient()
logged_in = api.login(get_conf().account['user'], get_conf().account['password'])

#----tpm
from gmusicapi import Webclient
webclient = Webclient()
webclient.login(get_conf().account['user'], get_conf().account['password'])
devices = webclient.get_registered_devices()
print devices
f = open('api_songs_all.json', 'w')
f.write(json.dumps(api.get_all_songs(), ensure_ascii=False).encode('utf-8'))
f.close()
#----end tpm

app = Flask(__name__)
app.debug = True

@app.route('/')
def index():
    return send_file('templates/index.html')
@app.route('/partials/<name>')
def template(name):
    return send_file('templates/' + name)
@app.route('/js/<name>')
def assets(name):
    return send_file('assets/' + name)

@app.route("/api/songs/all/")
def api_all_songs():
    return send_file('api_songs_all.json')

@app.route("/play/songs/<song_id>")
def play_song_by_id(song_id):
    client = mpd.MPDClient()
    client.connect("localhost", 6600)
    client.stop()
    client.clear()
    url = api.get_stream_url(song_id, get_conf().account['device'])
    client.add(url)
    client.play()
    return url

if __name__ == "__main__":
    app.run(host='0.0.0.0')
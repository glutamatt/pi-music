from flask import Flask, url_for, redirect
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
import json
webclient = Webclient()
webclient.login(get_conf().account['user'], get_conf().account['password'])
devices = webclient.get_registered_devices()
print devices
f = open('assets/api/songs_all.json', 'w')
f.write(json.dumps(api.get_all_songs(), ensure_ascii=False).encode('utf-8'))
f.close()
import sys
sys.exit(0)
#----end tpm

app = Flask(__name__)
app.debug = True

@app.route('/')
def index():
    return send_file('assets/templates/index.html')
@app.route('/assets/templates/<name>')
def assets_template(name):
    return send_file('assets/templates/' + name)
@app.route('/assets/js/<name>')
def assets_js(name):
    return send_file('assets/js/' + name)
@app.route('/assets/img/<name>')
def assets_img(name):
    return send_file('assets/img/' + name)
@app.route('/assets/api/<name>')
def assets_api(name):
    return send_file('assets/api/' + name)

@app.route("/play/songs/<song_id>")
def play_song_by_id(song_id):
    client = mpd.MPDClient()
    client.connect("localhost", 6600)
    client.stop()
    client.clear()
    url = url_for('stream_by_song_id', song_id=song_id, _external=True)
    client.add(url)
    client.play()
    return url

@app.route("/stream/<song_id>")
def stream_by_song_id(song_id):
    stream_url = api.get_stream_url(song_id, get_conf().account['device'])
    return redirect(stream_url)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
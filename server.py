from flask import Flask, url_for, redirect, request
import mpd
import config
from gmusicapi import Mobileclient
from flask import send_file

def get_conf():
    global config
    return config

def get_mpd_client():
    client = mpd.MPDClient()
    client.connect("localhost", 6600)
    return client

def generate_data_file():
    import time, os, stat, sys
    lifetime = time.time() - os.stat('assets/api/songs_all.json')[stat.ST_MTIME]
    if lifetime < 86400 :
        return
    from gmusicapi import Webclient
    import json
    webclient = Webclient()
    webclient.login(get_conf().account['user'], get_conf().account['password'])
    devices = webclient.get_registered_devices()
    print devices
    f = open('assets/api/songs_all.json', 'w')
    f.write(json.dumps(api.get_all_songs(), ensure_ascii=False).encode('utf-8'))
    f.close()

api = Mobileclient()
logged_in = api.login(get_conf().account['user'], get_conf().account['password'])

app = Flask(__name__)
app.debug = True

generate_data_file()

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


@app.route("/play/playpause")
def play_playpause():
    client = get_mpd_client()
    client.pause()
    status = client.status()
    return '1' if status['state'] == 'play' else '0'

@app.route("/play/songs/<song_id>")
def play_song_by_id(song_id):
    client = get_mpd_client()
    client.stop()
    client.clear()
    url = url_for('stream_by_song_id', song_id=song_id, _external=True)
    client.add(url)
    client.play()
    return url

@app.route("/play/list", methods=['POST'])
def play_list():
    client = get_mpd_client()
    client.stop()
    client.clear()
    for song_id in request.json['list']:
        client.add(url_for('stream_by_song_id', song_id=song_id, _external=True))
    client.play(request.json['start'])
    return 'yeah'

@app.route("/stream/<song_id>")
def stream_by_song_id(song_id):
    stream_url = api.get_stream_url(song_id, get_conf().account['device'])
    return redirect(stream_url)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
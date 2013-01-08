#!/usr/bin/env python

from mimetypes import guess_type

import envoy
from flask import Flask, render_template, request, redirect
from tumblpy import Tumblpy

import app_config
from render_utils import make_context
app = Flask(app_config.PROJECT_NAME)


# Example application views
@app.route('/')
@app.route('/index.html')
def simple():
    """
    Example view demonstrating rendering a simple HTML page.
    """
    return render_template('index.html', **make_context())


@app.route('/tumblr_form.html')
def tumblr_form():
    """
    Standalone form page to iframe into Tumblr.
    """
    return render_template('tumblr_form.html', **make_context())


@app.route('/misterpresident/', methods=['GET', 'POST'])
def post_to_tumblr():
    """
    """
    def _format(string, extra):
        return string.replace('-', ' ').replace("its", "it's").replace("didnt", "didn't").replace('i ', 'I ') + extra

    voted = _format(request.form['voted'])
    message = _format(request.form['message'])
    signed_name = _format(request.form['signed_name'])
    location = _format(request.form['location'])

    blog_url = 'testmisterpresident.tumblr.com'
    t = Tumblpy(
        app_key='Cxp2JzyA03QxmQixf7Fee0oIYaFtBTTHKzRA0AveHlh094bwDH',
        app_secret='QYQ6xuMMYzRmovnkiN1t5V0pLoeTPTYzNrMt1WH3gLDu3cm7XA',
        oauth_token='5jSuDYkecwiLxvSvpzcdnvI7UNY4ea5aHUjsV3hA24X3vwQwqe',
        oauth_token_secret='Ay59qTVESMoidphwEF4hjhTD25AruTqWrB9GLa31tXHewFkrQa')

    caption = u"<p>Dear Mr. President:<br/>%s<br/>%s<br/>Signed,<br/>%s from %s.</p>" % (
        voted,
        message,
        signed_name,
        location)

    q = t.post('post', blog_url=blog_url, params={
        'type': 'photo',
        'caption': caption,
        'data': request.files['image']
    })

    redirect_url = u"http://%s/%s" % (blog_url, q['id'])

    return redirect(redirect_url, code=301)


@app.route('/index_form.html')
def index_form():
    """
    'Dear Mr. President' submission form (pre-Inauguration)
    """
    return render_template('index_form.html', **make_context())


# Render LESS files on-demand
@app.route('/less/<string:filename>')
def _less(filename):
    with open('less/%s' % filename) as f:
        less = f.read()

    r = envoy.run('node_modules/.bin/lessc -', data=less)

    return r.std_out, 200, {'Content-Type': 'text/css'}


# Render JST templates on-demand
@app.route('/js/templates.js')
def _templates_js():
    r = envoy.run('node_modules/.bin/jst --template underscore jst')

    return r.std_out, 200, {'Content-Type': 'application/javascript'}


# Server arbitrary static files on-demand
@app.route('/<path:path>')
def _img(path):
    with open('www/%s' % path) as f:
        return f.read(), 200, {'Content-Type': guess_type(path)}


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)

#!/usr/bin/env python

from mimetypes import guess_type
import os
import re

import envoy
from flask import Flask, render_template, redirect
from tumblpy import Tumblpy

import app_config
from render_utils import make_context

app = Flask(app_config.PROJECT_NAME)
app.config['PROPAGATE_EXCEPTIONS'] = True


#
# Commenting out base routes.
#
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


@app.route('/dear-mr-president/', methods=['POST'])
def _post_to_tumblr():
    """
    Handles the POST to Tumblr.
    """
    def clean(string):
        """
        Formats a string all pretty.
        """
        return string.replace('-', ' ').replace("id ", "I'd ").replace("didnt", "didn't").replace('i ', 'I ')

    # Request is a global. Import it down here where we need it.
    from flask import request

    def strip_html(value):
        """
        Strips HTML from a string.
        """
        return re.compile(r'</?\S([^=]*=(\s*"[^"]*"|\s*\'[^\']*\'|\S*)|[^>])*?>', re.IGNORECASE).sub('', value)

    def strip_breaks(value):
        """
        Converts newlines, returns and other breaks to <br/>.
        """
        value = re.sub(r'\r\n|\r|\n', '\n', value)
        return value.replace('\n', '<br />')

    caption = u"""<p class='intro'>Dear Mr. President,</p>
    <p class='voted' data-vote-type='%s'>%s.</p>
    <p class='message'>%s</p>
    <p class='signature-name'>Signed,<br/>%s from %s</p>""" % (
        request.form['voted'],
        clean(request.form['voted']),
        strip_breaks(strip_html(request.form['message'])),
        strip_html(request.form['signed_name']),
        strip_html(request.form['location'])
    )

    return caption

    # t = Tumblpy(
    #     app_key=app_config.TUMBLR_KEY,
    #     app_secret=os.environ['TUMBLR_APP_SECRET'],
    #     oauth_token=os.environ['TUMBLR_OAUTH_TOKEN'],
    #     oauth_token_secret=os.environ['TUMBLR_OAUTH_TOKEN_SECRET'])

    # tumblr_post = t.post('post', blog_url=app_config.TUMBLR_URL, params={
    #     'type': 'photo',
    #     'caption': caption,
    #     'tags': u"%s" % request.form['voted'],
    #     'data': request.files['image']
    # })

    # return redirect(u"http://%s/%s#posts" % (app_config.TUMBLR_URL, tumblr_post['id']), code=301)


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
    app.run(host='0.0.0.0', port=8000, debug=app_config.DEBUG)

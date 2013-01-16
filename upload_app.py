#!/usr/bin/env python

import os
import re

from flask import Flask, redirect
from tumblpy import Tumblpy

import app_config

app = Flask(app_config.PROJECT_NAME)
app.config['PROPAGATE_EXCEPTIONS'] = True


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

    caption = u"<p class='intro'>Dear Mr. President,</p><p class='voted' data-vote-type='%s'>%s.</p><p class='message'>%s</p><p class='signature-name'>Signed,<br/>%s from %s</p><p class='footnote'>What do <em>you</em> want President Obama to remember in his second term? Share your message at <a href='http://inauguration2013.tumblr.com/'>NPR's Dear Mr. President</a>.</p>" % (
        request.form['voted'],
        clean(request.form['voted']),
        strip_breaks(strip_html(request.form['message'])),
        strip_html(request.form['signed_name']),
        strip_html(request.form['location'])
    )

    t = Tumblpy(
        app_key=app_config.TUMBLR_KEY,
        app_secret=os.environ['TUMBLR_APP_SECRET'],
        oauth_token=os.environ['TUMBLR_OAUTH_TOKEN'],
        oauth_token_secret=os.environ['TUMBLR_OAUTH_TOKEN_SECRET'])

    try:
        tumblr_post = t.post('post', blog_url=app_config.TUMBLR_URL, params={
            'type': 'photo',
            'caption': caption,
            'tags': u"%s" % request.form['voted'].replace('-', ''),
            'data': request.files['image']
        })
    except:
        return 'Sorry, we\'re probably over capacity. Please try again later.'

    return redirect(u"http://%s/%s#posts" % (app_config.TUMBLR_URL, tumblr_post['id']), code=301)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=app_config.DEBUG)

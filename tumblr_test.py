#!/usr/bin/env python

from tumblpy import Tumblpy
from random import choice

import os
import app_config


def clean(string):
    """
    Formats a string all pretty.
    """
    return string.replace('-', ' ').replace("id ", "I'd ").replace("didnt", "didn't").replace('i ', 'I ')

t = Tumblpy(
        app_key=app_config.TUMBLR_KEY,
        app_secret=os.environ['TUMBLR_APP_SECRET'],
        oauth_token=os.environ['TUMBLR_OAUTH_TOKEN'],
        oauth_token_secret=os.environ['TUMBLR_OAUTH_TOKEN_SECRET'])

tags = ['ivotedforyou', 'idrathernotsayhowivoted', 'ididntvoteforyou', 'ididntvote']

images = ['data/images/1.png', 'data/images/2.png', 'data/images/3.png', 'data/images/4.png']

n = 0
while n < 15:
    tag = choice(tags)
    if n % 5 == 0:
        tag += ',nprpicks'

    caption = u"""<p class='intro'>Dear Mr. President,</p>
    <p class='voted' data-vote-type='%s'>%s.</p>
    <p class='message'>This is a test post.</p>
    <p class='signature-name'>Signed,<br/>Test from Test, Test</p>""" % (
        tag,
        clean(tag),
    )

    filename = choice(images)

    with open(filename, 'rb') as f:
        tumblr_post = t.post('post', blog_url=app_config.TUMBLR_URL, params={
            'type': 'photo',
            'caption': caption,
            'tags': tag,
            'data': f
        })

    print n

    n += 1

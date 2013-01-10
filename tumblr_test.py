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

tags = ['i-voted-for-you', 'id-rather-not-say-how-i-voted', 'i-didnt-vote-for-you', 'i-didnt-vote']

images = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg']

n = 0
while n < 5:
    tag = choice(tags)
    if n % 5 == 0:
        tag += ',npr-picks'

    caption = u"""<p class='intro'>Dear Mr. President,</p>
    <p class='voted' data-vote-type='%s'>%s.</p>
    <p class='message'>This is a test post.</p>
    <p class='signature-name'>Signed,<br/>John from Chicago</p>""" % (
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

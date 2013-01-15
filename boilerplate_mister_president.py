#!/usr/bin/env python

import os

from tumblpy import Tumblpy

import app_config

t = Tumblpy(
        app_key=app_config.TUMBLR_KEY,
        app_secret=os.environ['TUMBLR_APP_SECRET'],
        oauth_token=os.environ['TUMBLR_OAUTH_TOKEN'],
        oauth_token_secret=os.environ['TUMBLR_OAUTH_TOKEN_SECRET'])

posts = t.get('posts', blog_url=app_config.TUMBLR_URL)

for post in posts['posts']:
    caption = post['caption']
    caption += '<p><a href="#">THIS IS THE THING I ADDED</a></p>'

    post = t.post('post/edit', blog_url=app_config.TUMBLR_URL, params={'id': post['id'], 'caption': caption})

    print post

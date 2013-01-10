#!/usr/bin/env python

import boto
import json
from tumblr import Api

import app_config

TUMBLR_FILENAME = 'www/live-data/misterpresident.json'
TUMBLR_MAX_POSTS = 10000
MAX_PER_CATEGORY = 100

api = Api(app_config.TUMBLR_BLOG_ID)

posts = list(api.read(max=TUMBLR_MAX_POSTS))

posts.reverse()

output = {
    'id-rather-not-say-how-i-voted': [],
    'i-voted-for-you': [],
    'i-didnt-vote-for-you': [],
    'i-didnt-vote': [],
    'npr-picks': [],
    'latest': []
}

for post in posts:
    simple_post = {
        'id': post['id'],
        'url': post['url'],
        'text': post['photo-caption'],
        'photo_url': post['photo-url-100'],
        'timestamp': post['unix-timestamp']
    }

    for tag in post['tags']:
        if tag == 'its-none-of-your-business-how-i-voted':
            tag = 'id-rather-not-say-how-i-voted'

        if len(output[tag]) <= MAX_PER_CATEGORY:
            output[tag].append(simple_post)

    if len(output['latest']) <= MAX_PER_CATEGORY:
        output['latest'].append(simple_post)

with open(TUMBLR_FILENAME, 'w') as f:
    f.write(json.dumps(output))

if app_config.DEPLOYMENT_TARGET:
    for bucket in app_config.S3_BUCKETS:
        conn = boto.connect_s3()
        bucket = conn.get_bucket(bucket)
        key = boto.s3.key.Key(bucket)
        key.key = '%s/live-data/misterpresident.json' % app_config.DEPLOYED_NAME
        key.set_contents_from_filename(
            TUMBLR_FILENAME,
            policy='public-read',
            headers={'Cache-Control': 'max-age=5 no-cache no-store must-revalidate'}
        )


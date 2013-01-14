#!/usr/bin/env python

import gzip
import json
import os

import boto
from tumblr import Api

import app_config

TUMBLR_FILENAME = 'www/live-data/misterpresident.json'
TUMBLR_MAX_POSTS = 10000
MAX_PER_CATEGORY = 100

api = Api(app_config.TUMBLR_BLOG_ID)

posts = list(api.read(max=TUMBLR_MAX_POSTS))

# posts.reverse()

output = {
    'idrathernotsayhowivoted': [],
    'ivotedforyou': [],
    'ididntvoteforyou': [],
    'ididntvote': [],
    'nprpicks': [],
    'latest': []
}

for post in posts:
    simple_post = {
        'id': post['id'],
        'url': post['url'],
        'text': post['photo-caption'],
        'photo_url': post['photo-url-100'],
        'photo_url_250': post['photo-url-250'],
        'timestamp': post['unix-timestamp']
    }

    for tag in post['tags']:
        if len(output[tag]) <= MAX_PER_CATEGORY:
            output[tag].append(simple_post)

    if len(output['latest']) <= MAX_PER_CATEGORY:
        output['latest'].append(simple_post)

json_output = json.dumps(output)

with open(TUMBLR_FILENAME, 'w') as f:
    f.write(json_output)

if app_config.DEPLOYMENT_TARGET:
    with gzip.open(TUMBLR_FILENAME + '.gz', 'wb') as f:
        f.write(json_output)

    for bucket in app_config.S3_BUCKETS:
        conn = boto.connect_s3()
        bucket = conn.get_bucket(bucket)
        key = boto.s3.key.Key(bucket)
        key.key = '%s/live-data/misterpresident.json' % app_config.DEPLOYED_NAME
        key.set_contents_from_filename(
            TUMBLR_FILENAME + '.gz',
            policy='public-read',
            headers={
                'Cache-Control': 'max-age=5 no-cache no-store must-revalidate',
                'Content-Encoding': 'gzip'
            }
        )

    os.remove(TUMBLR_FILENAME + '.gz')

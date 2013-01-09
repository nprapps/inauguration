#!/usr/bin/env python

import boto
import json
from tumblr import Api

import app_config

TUMBLR_FILENAME = 'www/live-data/misterpresident.json'
TUMBLR_BLOG_ID = 'testmisterpresident'
TUMBLR_MAX_POSTS = 10000

api = Api(TUMBLR_BLOG_ID)

posts = list(api.read(max=TUMBLR_MAX_POSTS))

posts.reverse()

with open(TUMBLR_FILENAME, 'w') as f:
    f.write(json.dumps(posts))

if app_config.DEPLOYMENT_TARGET:
    for bucket in app_config.S3_BUCKETS:
        conn = boto.connect_s3()
        bucket = conn.get_bucket(bucket)
        key = boto.s3.key.Key(bucket)
        key.key = '%s/live-data/backchannel.json' % app_config.DEPLOYED_NAME
        key.set_contents_from_filename(
            TUMBLR_FILENAME,
            policy='public-read',
            headers={'Cache-Control': 'max-age=5 no-cache no-store must-revalidate'}
        )


#!/usr/bin/env python

import os

PROJECT_NAME = 'inauguration'
DEPLOYED_NAME = PROJECT_NAME

PRODUCTION_S3_BUCKETS = ['apps.npr.org', 'apps2.npr.org']
PRODUCTION_SERVERS = ['54.245.228.214']
SERVERS = None

STAGING_S3_BUCKETS = ['stage-apps.npr.org']
STAGING_SERVERS = ['54.245.225.88']
S3_BUCKETS = None

DEPLOYMENT_TARGET = os.environ.get('DEPLOYMENT_TARGET', None)

DEBUG = False

TUMBLR_URL = None
TUMBLR_KEY = None


def configure_targets(deployment_target):
    """
    Configure deployment targets. Functionalized
    so they can be forced during deployment.
    """
    global DEBUG, S3_BUCKETS, SERVERS, TUMBLR_URL, TUMBLR_BLOG_ID, TUMBLR_KEY

    if deployment_target == 'dev':
        DEBUG = True

    if deployment_target == 'production':
        S3_BUCKETS = PRODUCTION_S3_BUCKETS
        SERVERS = PRODUCTION_SERVERS
        TUMBLR_URL = 'inauguration2013.tumblr.com'
        TUMBLR_BLOG_ID = 'inauguration2013'
        TUMBLR_KEY = 'Cxp2JzyA03QxmQixf7Fee0oIYaFtBTTHKzRA0AveHlh094bwDH'
    else:
        S3_BUCKETS = STAGING_S3_BUCKETS
        SERVERS = STAGING_SERVERS
        TUMBLR_URL = 'inaugurationtest.tumblr.com'
        TUMBLR_BLOG_ID = 'inaugurationtest'
        TUMBLR_KEY = 'BY8IUMsmErCgSIkC44VqNIrs31QXPogKzv3L3ScyUEsEzY51GI'

# Configure targets on import
configure_targets(DEPLOYMENT_TARGET)

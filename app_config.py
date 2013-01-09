#!/usr/bin/env python

import os

PROJECT_NAME = 'inauguration'
DEPLOYED_NAME = PROJECT_NAME

PRODUCTION_S3_BUCKETS = ['apps.npr.org', 'apps2.npr.org']
PRODUCTION_SERVERS = ['cron.nprapps.org']

STAGING_S3_BUCKETS = ['stage-apps.npr.org']
STAGING_SERVERS = ['cron-staging.nprapps.org']

DEPLOYMENT_TARGET = os.environ.get('DEPLOYMENT_TARGET', None)

DEBUG = False
if os.environ.get('DEPLOYMENT_TARGET', None) == 'dev':
    DEBUG = True

if DEPLOYMENT_TARGET == 'production':
    S3_BUCKETS = PRODUCTION_S3_BUCKETS
    SERVERS = PRODUCTION_SERVERS
else:
    S3_BUCKETS = STAGING_S3_BUCKETS
    SERVERS = STAGING_SERVERS

TUMBLR_KEY = 'Cxp2JzyA03QxmQixf7Fee0oIYaFtBTTHKzRA0AveHlh094bwDH'
TUMBLR_URL = 'inauguration2013.tumblr.com'

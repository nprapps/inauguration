#!/usr/bin/env python

from glob import glob
import os

from fabric.api import *

import app
import app_config
from etc import github
# import outputs

"""
Base configuration
"""
env.project_name = app_config.PROJECT_NAME
env.deployed_name = app_config.DEPLOYED_NAME
env.deploy_to_servers = True
env.repo_url = 'git@github.com:nprapps/%(project_name)s.git' % env
env.alt_repo_url = None  # 'git@bitbucket.org:nprapps/%(project_name)s.git' % env
env.user = 'ubuntu'
env.python = 'python2.7'
env.path = '/home/%(user)s/apps/%(project_name)s' % env
env.repo_path = '%(path)s/repository' % env
env.virtualenv_path = '%(path)s/virtualenv' % env
env.forward_agent = True


"""
Environments
"""
def production():
    env.settings = 'production'
    env.s3_buckets = app_config.PRODUCTION_S3_BUCKETS
    env.hosts = app_config.PRODUCTION_SERVERS


def staging():
    env.settings = 'staging'
    env.s3_buckets = app_config.STAGING_S3_BUCKETS
    env.hosts = app_config.STAGING_SERVERS


"""
Branches
"""
def stable():
    """
    Work on stable branch.
    """
    env.branch = 'stable'


def master():
    """
    Work on development branch.
    """
    env.branch = 'master'


def branch(branch_name):
    """
    Work on any specified branch.
    """
    env.branch = branch_name


def _confirm_branch():
    """
    Confirm a production deployment.
    """
    if (env.settings == 'production' and env.branch != 'stable'):
        answer = prompt("You are trying to deploy the '%(branch)s' branch to production.\nYou should really only deploy a stable branch.\nDo you know what you're doing?" % env, default="Not at all")
        if answer not in ('y','Y','yes','Yes','buzz off','screw you'):
            exit()


"""
Template-specific functions
"""
def less():
    """
    Render LESS files to CSS.
    """
    for path in glob('less/*.less'):
        filename = os.path.split(path)[-1]
        name = os.path.splitext(filename)[0]
        out_path = 'www/css/%s.css' % name

        local('node_modules/less/bin/lessc %s %s' % (path, out_path))


def jst():
    """
    Render Underscore templates to a JST package.
    """
    local('node_modules/universal-jst/bin/jst.js --template underscore jst www/js/templates.js')


def render():
    """
    Render HTML templates and compile assets.
    """
    from flask import g

    # Fake out settings for deployment
    app_config.configure_targets(env.get('settings', None))

    less()
    jst()

    compiled_includes = []

    for rule in app.app.url_map.iter_rules():
        rule_string = rule.rule
        name = rule.endpoint

        if name == 'static':
            print 'Skipping %s' % name
            continue

        if name.startswith('_'):
            print 'Skipping %s' % name
            continue

        if rule_string.endswith('/'):
            filename = 'www' + rule_string + 'index.html'
        elif rule_string.endswith('.html'):
            filename = 'www' + rule_string
        else:
            print 'Skipping %s' % name
            continue

        print 'Rendering %s' % (filename)

        with app.app.test_request_context(path=rule_string):
            g.compile_includes = True
            g.compiled_includes = compiled_includes

            view = app.__dict__[name]
            content = view()

            compiled_includes = g.compiled_includes

        with open(filename, 'w') as f:
            f.write(content)

    # Reset faked-out settings
    app_config.configure_targets(app_config.DEPLOYMENT_TARGET)


"""
Setup
"""
def setup():
    """
    Setup servers for deployment.
    """
    require('settings', provided_by=[production, staging])
    require('branch', provided_by=[stable, master, branch])

    setup_directories()
    setup_virtualenv()
    clone_repo()
    checkout_latest()
    install_requirements()


def setup_directories():
    """
    Create server directories.
    """
    require('settings', provided_by=[production, staging])

    run('mkdir -p %(path)s' % env)


def setup_virtualenv():
    """
    Setup a server virtualenv.
    """
    require('settings', provided_by=[production, staging])

    run('virtualenv -p %(python)s --no-site-packages %(virtualenv_path)s' % env)
    run('source %(virtualenv_path)s/bin/activate' % env)


def clone_repo():
    """
    Clone the source repository.
    """
    require('settings', provided_by=[production, staging])

    run('git clone %(repo_url)s %(repo_path)s' % env)

    if env.get('alt_repo_url', None):
        run('git remote add bitbucket %(alt_repo_url)s' % env)


def checkout_latest(remote='origin'):
    """
    Checkout the latest source.
    """
    require('settings', provided_by=[production, staging])

    env.remote = remote

    run('cd %(repo_path)s; git fetch %(remote)s' % env)
    run('cd %(repo_path)s; git checkout %(branch)s; git pull %(remote)s %(branch)s' % env)


def install_requirements():
    """
    Install the latest requirements.
    """
    require('settings', provided_by=[production, staging])

    run('%(virtualenv_path)s/bin/pip install -U -r %(repo_path)s/requirements.txt' % env)


def bootstrap_issues():
    """
    Bootstraps Github issues with default configuration.
    """
    auth = github.get_auth()
    github.delete_existing_labels(auth)
    github.create_default_labels(auth)
    github.create_default_tickets(auth)


"""
Deployment
"""
def _deploy_to_s3():
    """
    Deploy the gzipped stuff to
    """
    s3cmd = 's3cmd -P --add-header=Cache-Control:max-age=5 --add-header=Content-encoding:gzip --guess-mime-type --recursive --exclude live-data/* sync gzip/ %s'

    for bucket in env.s3_buckets:
        env.s3_bucket = bucket
        local(s3cmd % ('s3://%(s3_bucket)s/%(deployed_name)s/' % env))


def _gzip_www():
    """
    Gzips everything in www and puts it all in gzip
    """
    local('python gzip_www.py')


def deploy(remote='origin'):
    require('settings', provided_by=[production, staging])
    require('branch', provided_by=[stable, master, branch])

    _confirm_branch()
    render()
    _gzip_www()
    _deploy_to_s3()

    # if env.get('deploy_to_servers', False):
    #     checkout_latest(remote)


"""
Destruction
"""
def shiva_the_destroyer():
    """
    Deletes the app from s3
    """
    with settings(warn_only=True):
        s3cmd = 's3cmd del --recursive %s' % env

        for bucket in env.s3_buckets:
            env.s3_bucket = bucket
            local(s3cmd % ('s3://%(s3_bucket)s/%(deployed_name)s' % env))

        if env.get('alt_s3_bucket', None):
            local(s3cmd % ('s3://%(alt_s3_bucket)s/%(deployed_name)s' % env))

        if env.get('deploy_to_servers', False):
            run('rm -rf %(path)s' % env)


"""
App-specific functions
"""
def write_mr_president_json():
    """
    Writes out the tumblr json for Dear Mr. President.
    """
    outputs.write_mr_president_json()


##
## One-time use. Don't use this.
##

# def update_mr_president_posts():
#     """
#     Updates tumblr posts for Dear Mr. President.
#     """
#     outputs.update_mr_president_posts()


def write_mr_president_test_posts():
    """
    Writes some test posts for Dear Mr. President.
    """
    outputs.write_mr_president_test_posts()


def generate_new_oauth_tokens():
    outputs.generate_new_oauth_tokens()


def dump_tumblr_json():
    outputs.dump_tumblr_json()


def deploy_radio(path):
    """
    Deploys an radio status file to radio.json
    """
    require('settings', provided_by=[production, staging])

    for bucket in env.s3_buckets:
        local('s3cmd -P --add-header=Cache-control:max-age=5 put ' + path + ' s3://' + bucket + '/%(deployed_name)s/live-data/radio.json' % env)


def radio_off():
    """
    Shortcut to deploy_radio:data/radio-off.json
    """
    deploy_radio('data/radio-off.json')


def radio_pregame():
    """
    Shortcut to deploy_radio:data/radio-pregame.json
    """
    deploy_radio('data/radio-pregame.json')


def radio_live():
    """
    Shortcut to deploy_radio:data/radio-live.json
    """
    deploy_radio('data/radio-live.json')


def local_cron():
    """
    Run fake cron jobs.
    """
    local('while true; do fab update_mister_president; date; sleep 2; done')

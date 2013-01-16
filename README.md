inauguration
============

Install requirements
--------------------

Node.js is required for the static asset pipeline. If you don't already have it, get it like this:

```
brew install node
curl https://npmjs.org/install.sh | sh
```

Then install the project requirements:

```
cd $NEW_PROJECT_NAME
npm install less universal-jst
mkvirtualenv $NEW_PROJECT_NAME
pip install -r requirements.txt
```

Adding a template/view
----------------------

A site can have any number of rendered templates (i.e. pages). Each will need a corresponding view. To create a new one:

* Add a template to the ``templates`` directory. Ensure it extends ``_base.html``.
* Add a corresponding view function to ``app.py``. Decorate it with a route to the page name, i.e. ``@app.route('/filename.html')``
* By convention only views that end with ``.html`` and do not start with ``_``  will automatically be rendered when you call ``fab render``.

Run the project locally
-----------------------

First setup your local live-data files:

```
workon $NEW_PROJECT_NAME
cp data/radio-off.json www/live-data/radio.json
fab update_backchannel
```

Export the tumblr OAuth tokens:
```
export TUMBLR_APP_SECRET=QYQ...
export TUMBLR_OAUTH_TOKEN=5jS...
export TUMBLR_OAUTH_TOKEN_SECRET=Ay5...
```

Update your hosts file to assign localhost to the domain ``fake.npr.org`` so that authentication will work. Do something like ``sudo nano -w /etc/hosts`` and add a line at the bottom like ``127.0.0.1    fake.npr.org``.


A flask app is used to run the project locally. It will automatically compile templates and assets on demand.

```
python app.py
```

Visit ``http://fake.npr.org:8000`` in your browser.

Running the Javascript tests
----------------------------

With your local server running, visit ``http://localhost:8000/test/SpecRunner.html``.

Compile with static assets
--------------------------

Compile LESS to CSS, compile javascript templates to Javascript and minify all assets:

```
workon $NEW_PROJECT_NAME
fab render
```

(This is done automatically whenever you deploy to S3.)

Test the rendered app
---------------------

If you want to test the app once you've rendered it out, just use the Python webserver:

```
cd www
python -m SimpleHTTPServer
```

Deploy to S3
------------

```
fab staging master deploy
```

Deploy to a server
------------------

The current configuration is for running cron jobs only. Web server configuration is not included.

* In ``fabfile.py`` set ``env.deploy_to_servers`` to ``True``.
* Run ``fab staging master setup`` to configure the server.
* Run ``fab staging master deploy`` to deploy the app.

Cron jobs
----------
Cron jobs live as bash scripts inside ``/cron/`` in the repository root.

* Download, reformat and cache Tumblr postcards to JSON on S3.
```
* * * * * /home/ubuntu/apps/inauguration/repository/cron/mr_president
```

Output functions
-----------------
* ``fab write_mr_president_json`` writes a JSON cache of Tumblr postcards to ``/www/live-data/`` and uploads it to S3. Replaces ``update_mr_president.py`` from the main repository.
* ``fab generate_new_oauth_tokens`` generates new OAuth tokens for our Tumblr account. **WARNING** This will invalidate the old tokens and you'll need to update the token exports in ``/etc/init/inauguration.conf``. Replaces ``oauth.py`` from the main repository.
* ``fab write_mr_president_test_posts`` writes test postcards to our Tumblr blog. Choose the number by setting the constant. This will also add random tags to the postcards. Replaces ``test_tumblr.py`` from the main repository.
* ``fab dump_tumblr_json`` will roll through pages of the Tumblr API and dump JSON for the posts to files in ``/data/backups/`` for reconstitution. **WARNING** We do not have a script to reconstitute from this dump yet.
* ``fab update_mr_president_posts`` adds boilerplate text to Tumblr posts that are missing it. **WARNING** This has already been used. Please do not reuse it, though it is supposedly idempotent.
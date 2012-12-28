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

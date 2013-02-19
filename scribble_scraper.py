#!/usr/bin/env python

import json
import requests
import os
import urlparse

event_id = '78919'
current_page = '0'
url = 'http://apiv1.scribblelive.com/event/%s/page/%s/?Token=FtP7wRfX&format=json'

r = requests.get(url % (event_id, current_page))
json_data = r.json
max_pages = json_data['Pages']
pages = range(0, max_pages)

output = {}

# Chat data
output['Id'] = json_data['Id']
output['Title'] = json_data['Title']
output['Description'] = json_data['Description']
output['IsLive'] = json_data['IsLive']
output['IsCommenting'] = json_data['IsCommenting']
output['IsModerated'] = json_data['IsModerated']

# Chat posts
output['Posts'] = json_data['Posts']

for page in pages:
  r = requests.get(url % (event_id, page))
  output['Posts'] += r.json['Posts']

# Sort bc Scribble doesn't support order param with pages?!?!?!?!
output['Posts'] = sorted(output['Posts'], key=lambda post: post['Created'])

filename ='www/live-data/scribble-archive.json'
print "Writing JSON file to %s." % filename

json_output = json.dumps(output)

with open(filename, 'w') as f:
  f.write(json_output)

print "JSON written."

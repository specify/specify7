# -*- python -*-
import os, sys, json

this_dir = os.path.dirname(__file__)

with open(os.path.join(this_dir, 'db_map.json')) as f:
    db_map = json.load(f)

sys.path.append(this_dir)
os.environ['DJANGO_SETTINGS_MODULE'] = 'specifyweb.settings'

from django.core.wsgi import get_wsgi_application

def application(environ, start_response):
    server_name = environ['SERVER_NAME'].split('.')[0]
    os.environ['SPECIFY_DATABASE_NAME'] = db_map[server_name]
    django_app = get_wsgi_application()
    return django_app(environ, start_response)

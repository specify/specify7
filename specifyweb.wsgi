# -*- python -*-
import os
import sys

# this is needed to prevent threading issues with mod_wsgi, e.g.
# ImportError: Failed to import _strptime because the import lockis held by another thread.
# might be fixed in python 3
# see: https://code.google.com/p/modwsgi/issues/detail?id=177

from datetime import datetime
datetime.strptime('01/14/2014', '%m/%d/%Y')

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'specifyweb.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

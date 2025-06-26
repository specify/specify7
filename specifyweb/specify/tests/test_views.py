from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests
from unittest.mock import MagicMock, patch

from specifyweb.specify.api import StaleObjectException, MissingVersionException
from importlib import reload

import sys

# This is actually fine here, because we end up reloading the views module anyways.
from specifyweb.specify.views import HttpResponseConflict

def _raise(*args, **kwargs):
    print("in the raise?")
    return HttpResponseConflict()

class TestViews(ApiTests):
    
    @patch("specifyweb.specify.views.api.resource_dispatch", new=_raise)
    def test_resource_view(self):
        reload(sys.modules['specifyweb.specify.views'])
        reload(sys.modules['specifyweb.specify.urls'])
        
        c = Client()
        c.force_login(self.specifyuser)
        c.get("/api/specify/collectionobject/1/")
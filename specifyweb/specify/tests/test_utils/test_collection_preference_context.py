# TODO: Make this part of generic test infrastructure. Quite useful.
from specifyweb.specify.models import Spappresource, Spappresourcedata, Spappresourcedir
from specifyweb.specify.tests.test_api import ApiTests

import json

class TestCollectionPreferenceContext(ApiTests):
    
    def setUp(self):
        super().setUp()
        app_dir = Spappresourcedir.objects.create(
            **dict(
                ispersonal=False,
                usertype=None,
                collection=self.collection,
                discipline=self.discipline
            )
        )
        app = Spappresource.objects.create(
            spappresourcedir_id=app_dir.id,
            name="CollectionPreferences",
            level=0,
            specifyuser=self.specifyuser
        )
        self.app_data = Spappresourcedata.objects.create(
            spappresource=app,
        )
        self.app_dir = app_dir
        self.app = app

    def _delete_all(self):
        self.app_data.delete()
        self.app.delete()
        self.app_dir.delete()
    
    def _update_data(self, new_data):
        self.app_data.data = json.dumps(new_data)
        self.app_data.save()


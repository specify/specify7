from django.test import Client

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.models import (
    Spappresourcedata,
    Spappresourcedir,
    Spappresource,
)
from specifyweb.backend.context.remote_prefs import (
    cache_remote_preferences,
    get_all_remote_prefs_database,
    get_global_pref,
    get_pref_from_database,
    get_preference,
    get_remote_pref,
)


class RemotePrefsTests(ApiTests):
    def _create_preferences(self, usertype, content):
        directory = Spappresourcedir.objects.create(
            ispersonal=False, usertype=usertype
        )
        resource = Spappresource.objects.create(
            spappresourcedir=directory,
            specifyuser=self.specifyuser,
            level=0,
            name="preferences",
            mimetype="text/plain",
        )
        Spappresourcedata.objects.create(spappresource=resource, data=content.encode())

    def setUp(self):
        super().setUp()
        Spappresourcedata.objects.all().delete()

    def test_get_preference(self):
        prefs = "a=1\nb=2"
        self.assertEqual(get_preference(prefs, "b"), "2")
        self.assertIsNone(get_preference(prefs, "missing"))

    def test_get_all_remote_prefs_database(self):
        self._create_preferences("Prefs", "CO_CREATE_COA_4=true")
        self.assertEqual(get_all_remote_prefs_database(), "CO_CREATE_COA_4=true")

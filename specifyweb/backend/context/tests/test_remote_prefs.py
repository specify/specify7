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

    def test_get_pref_from_database_unknown_type(self):
        with self.assertRaises(ValueError):
            get_pref_from_database("a", "bogus")

    def test_get_remote_pref(self):
        self._create_preferences("Prefs", "auditing.do_audits=false")
        self.assertEqual(get_remote_pref("auditing.do_audits"), "false")

    def test_get_global_pref(self):
        self._create_preferences("Global Prefs", "AUDIT_LIFESPAN_MONTHS=12")
        self.assertEqual(get_global_pref("AUDIT_LIFESPAN_MONTHS"), "12")

    def test_remote_pref_caching(self):
        self._create_preferences("Prefs", "auditing.do_audits=false")
        with cache_remote_preferences():
            self.assertEqual(get_remote_pref("auditing.do_audits"), "false")
            Spappresourcedata.objects.all().update(data=b"auditing.do_audits=true")
            # the cached value is returned even after the database changed
            self.assertEqual(get_remote_pref("auditing.do_audits"), "false")

    def test_remoteprefs_endpoint(self):
        self._create_preferences("Prefs", "CO_CREATE_COA_4=true")

        c = Client()
        c.force_login(self.specifyuser)
        response = c.get("/context/remoteprefs.properties")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), "CO_CREATE_COA_4=true")

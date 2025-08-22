from unittest.mock import Mock, patch
from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests

import json

class TestUploadLocalitySet(ApiTests):
    
    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c
    
    def _import(self, background, callback: Mock):
        data = dict(
            columnHeaders=['localityName'],
            data=[['testLocality']],
            createRecordSet=True,
            runInBackground=background
        )

        callback.return_value = "OK"

        response = self.c.post(
            f"/locality_update_tool/localityset/import/",
            data,
            content_type="application/json"
        )

        callback.assert_called_once_with(
            self.collection,
            self.specifyuser,
            self.agent,
            data['columnHeaders'],
            data['data'],
            data['createRecordSet']
        )

        self._assertStatusCodeEqual(response, 201 if background else 200)
        self.assertEqual(json.loads(response.content.decode()), "OK")

    @patch("specifyweb.specify.views.upload_locality_set_foreground")
    def test_import_foreground(self, callback):
        self._import(False, callback)

    @patch("specifyweb.specify.views.start_locality_set_background")
    def test_import_background(self, callback):
        self._import(True, callback)
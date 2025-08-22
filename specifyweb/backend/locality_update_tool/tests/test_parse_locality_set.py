from unittest.mock import Mock, patch
from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests


from specifyweb.backend.locality_update_tool.update_locality import ParseError

from uuid import uuid4 as base_uuid4

class TestParseLocalitySet(ApiTests):
    
    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c
    

    @patch("specifyweb.specify.views.parse_locality_set_foreground")
    def test_parse_foreground(self, callback: Mock):
        data = dict(
            columnHeaders=['localityName'],
            data=[['testLocality']],
            runInBackground=False
        )

        callback.return_value = (422, [ParseError(message="guidHeaderNotProvided", field='guid', payload=None, row_number=0)])

        response = self.c.post(
            f"/locality_update_tool/localityset/parse/",
            data,
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 422)

        callback.assert_called_once_with(
            self.collection,
            data['columnHeaders'],
            data['data'],
        )

    @patch("specifyweb.specify.views.uuid4")
    @patch("specifyweb.specify.views.start_locality_set_background")
    def test_parse_background(self, callback: Mock, mock_uuid4: Mock):
        mock_uuid4.return_value = str(base_uuid4())

        data = dict(
            columnHeaders=['localityName'],
            data=[['testLocality']],
            runInBackground=True
        )

        callback.return_value = []

        response = self.c.post(
            f"/locality_update_tool/localityset/parse/",
            data,
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 201)

        callback.assert_called_once_with(
            self.collection,
            self.specifyuser,
            self.agent,
            data['columnHeaders'],
            data['data'],
            False,
            True
        )
        

import json
from unittest.mock import patch

from django.test import Client

from specifyweb.specify.models import Spversion
from specifyweb.specify.tests.test_api import ApiTests


class TestSystemInfo(ApiTests):
    def test_system_info_during_guided_setup_returns_safe_payload(self):
        c = Client()
        c.force_login(self.specifyuser)
        c.cookies['collection'] = str(self.collection.id)

        with patch('specifyweb.backend.context.views.is_guided_setup_complete', return_value=False):
            response = c.get('/context/system_info.json')

        self._assertStatusCodeEqual(response, 200)
        payload = json.loads(response.content.decode())

        self.assertFalse(payload['setup_complete'])
        self.assertIsNone(payload['database_version'])
        self.assertIsNone(payload['schema_version'])
        self.assertIsNone(payload['institution'])
        self.assertIsNone(payload['institution_guid'])
        self.assertIsNone(payload['discipline'])
        self.assertIsNone(payload['collection'])
        self.assertIsNone(payload['collection_guid'])
        self.assertIsNone(payload['isa_number'])
        self.assertIsNone(payload['discipline_type'])
        self.assertIsNone(payload['geography_is_global'])
        self.assertIn('version', payload)
        self.assertIn('specify6_version', payload)

    def test_system_info_after_guided_setup_returns_full_payload(self):
        Spversion.objects.create(appversion='7', schemaversion='2.10')

        c = Client()
        c.force_login(self.specifyuser)
        c.cookies['collection'] = str(self.collection.id)

        with patch('specifyweb.backend.context.views.is_guided_setup_complete', return_value=True):
            response = c.get('/context/system_info.json')

        self._assertStatusCodeEqual(response, 200)
        payload = json.loads(response.content.decode())

        self.assertTrue(payload['setup_complete'])
        self.assertEqual(payload['database_version'], '7')
        self.assertEqual(payload['schema_version'], '2.10')
        self.assertEqual(payload['institution'], self.institution.name)
        self.assertEqual(payload['institution_guid'], self.institution.guid)
        self.assertEqual(payload['discipline'], self.discipline.name)
        self.assertEqual(payload['collection'], self.collection.collectionname)
        self.assertEqual(payload['collection_guid'], self.collection.guid)
        self.assertEqual(payload['isa_number'], self.collection.isanumber)
        self.assertEqual(payload['discipline_type'], self.discipline.type)
        self.assertEqual(
            payload['geography_is_global'], self.institution.issinglegeographytree
        )

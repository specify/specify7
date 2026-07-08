import json

from django.test import Client

from specifyweb.specify.tests.test_api import ApiTests


class CollectionStatisticsTests(ApiTests):
    def test_collection_statistics_returns_expected_shape(self):
        client = Client()
        client.force_login(self.specifyuser)

        response = client.get('/stats/collection/statistics/')

        self.assertEqual(response.status_code, 200)

        payload = json.loads(response.content.decode())
        self.assertIsInstance(payload, list)
        self.assertGreaterEqual(len(payload), 1)

        first_row = payload[0]
        self.assertEqual(
            set(first_row.keys()),
            {'name', 'specimenCount', 'collectionType'},
        )
        self.assertIsInstance(first_row['name'], str)
        self.assertIsInstance(first_row['specimenCount'], int)
        self.assertIsInstance(first_row['collectionType'], str)

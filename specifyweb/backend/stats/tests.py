import json
from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests


class StatsTests(ApiTests):
    def test_collection_statistics(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get('/stats/collection/statistics/')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)
        self.assertIsInstance(data, list)
        for item in data:
            self.assertIsInstance(item['name'], str)
            self.assertIsInstance(item['specimenCount'], int)
            self.assertIsInstance(item['collectionType'], str)
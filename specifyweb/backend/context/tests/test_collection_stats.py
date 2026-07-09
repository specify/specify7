from specifyweb.specify.tests.test_api import ApiTests
from django.test import Client
import json


class TestCollectionStats(ApiTests):

    def test_collection_stats(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get('/context/collection_stats.json')

        self._assertStatusCodeEqual(response, 200)

        stats = json.loads(response.content.decode())

        # The endpoint returns a (non-empty) list of stat objects.
        self.assertIsInstance(stats, list)
        self.assertGreater(len(stats), 0)

        # Each entry has exactly the expected shape and field types.
        for stat in stats:
            self.assertEqual(
                set(stat.keys()),
                {'name', 'specimenCount', 'collectionType'},
            )
            self.assertIsInstance(stat['name'], str)
            self.assertIsInstance(stat['specimenCount'], int)
            self.assertIsInstance(stat['collectionType'], str)

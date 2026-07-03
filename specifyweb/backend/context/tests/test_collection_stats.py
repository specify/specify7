import json

from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests


class TestCollectionStats(ApiTests):

    def test_returns_expected_shape(self):
        """GET should return 200 and the rows with the expected keys"""
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/context/collection_stats.json")

        self._assertStatusCodeEqual(response, 200)

        stats = json.loads(response.content.decode())
        self.assertIsInstance(stats, list)
        self.assertGreater(len(stats), 0)
        for row in stats:
            self.assertEqual(set(row.keys()), {"name", "specimenCount", "collectionType"})
            self.assertIsInstance(row["name"], str)
            self.assertIsInstance(row["specimenCount"], int)
            self.assertIsInstance(row["collectionType"], str)

    def test_rejects_post(self):
        """POST rejection test because the endpoint is read only"""
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post("/context/collection_stats.json")

        self._assertStatusCodeEqual(response, 405)

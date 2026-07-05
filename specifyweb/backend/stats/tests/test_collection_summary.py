import json

from django.test import Client

from specifyweb.specify.tests.test_api import ApiTests


class TestCollectionSummary(ApiTests):
    """Tests for the GET /stats/collection/summary/ endpoint (issue #8185)."""

    endpoint = '/stats/collection/summary/'

    def setUp(self):
        super().setUp()
        self.client = Client()
        self.client.force_login(self.specifyuser)

    def test_returns_ok_and_list(self):
        response = self.client.get(self.endpoint)
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_each_item_has_expected_shape(self):
        response = self.client.get(self.endpoint)
        data = json.loads(response.content)

        for item in data:
            self.assertEqual(
                set(item.keys()), {'name', 'specimenCount', 'collectionType'}
            )
            self.assertIsInstance(item['name'], str)
            self.assertIsInstance(item['specimenCount'], int)
            self.assertIsInstance(item['collectionType'], str)

    def test_requires_authentication(self):
        # @login_maybe_required rejects unauthenticated requests.
        response = Client().get(self.endpoint)
        self.assertEqual(response.status_code, 403)

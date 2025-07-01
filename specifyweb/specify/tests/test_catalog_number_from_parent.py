from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests

import json

class TestCatalogNumberFromSibling(ApiTests):

    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def test_no_id_error(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/api/specify/catalog_number_from_parent/",
            json.dumps(dict(catalognumber=co.catalognumber)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(json.loads(response.content.decode()), {'error': "'id' field is required."})

    def test_invalid_body(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/api/specify/catalog_number_from_parent/",
            "Not a JSON: Value",
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(json.loads(response.content.decode()), {'error': 'Invalid JSON body.'})

    def test_simple_co(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/api/specify/catalog_number_from_parent/",
            json.dumps(dict(id=co.id)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 404)
        self.assertEqual(json.loads(response.content.decode()), {'error': 'Parent or parent catalog number not found.'})

    def test_parent_catalog_number(self):
        co = self.collectionobjects[0]

        parent_co = self.collectionobjects[1]
        self._update(
            co,
            dict(componentParent=parent_co)
        )

        response = self.c.post(
            "/api/specify/catalog_number_from_parent/",
            json.dumps(dict(id=co.id)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(json.loads(response.content.decode()), "num-1")
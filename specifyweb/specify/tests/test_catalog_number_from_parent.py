from django.test import Client
from specifyweb.specify.models import Component
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
        response = self.c.post(
            "/api/specify/catalog_number_from_parent/",
            "Not a JSON: Value",
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(json.loads(response.content.decode()), {'error': 'Invalid JSON body.'})

    def test_parent_catalog_number(self):
        component = Component.objects.create(collectionobject_id=self.collectionobjects[0].id)

        response = self.c.post(
            "/api/specify/catalog_number_from_parent/",
            json.dumps(dict(id=component.id)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(json.loads(response.content.decode()), "num-0")
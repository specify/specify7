from django.test import Client


import json

from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions

class TestCatalogNumberFromSibling(TestCogInteractions):

    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def test_no_id_error(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/inheritance/catalog_number_for_sibling/",
            json.dumps(dict(catalognumber=co.catalognumber)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(json.loads(response.content.decode()), {'error': "'id' field is required."})

    def test_invalid_body(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/inheritance/catalog_number_for_sibling/",
            "Not a JSON: Value",
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(json.loads(response.content.decode()), {'error': 'Invalid JSON body.'})

    def test_simple_co(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/inheritance/catalog_number_for_sibling/",
            json.dumps(dict(id=co.id)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(json.loads(response.content.decode()), None)

    def test_simple_co_catalognumber(self):
        co = self.collectionobjects[0]
        response = self.c.post(
            "/inheritance/catalog_number_for_sibling/",
            json.dumps(dict(id=co.id)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(json.loads(response.content.decode()), None)

    def test_self_is_primary(self):
        # In this case, the provided CO is itself primary.
        self._link_co_cog(self.collectionobjects[0], self.test_cog_discrete, isprimary=True)
        self._link_co_cog(self.collectionobjects[1], self.test_cog_discrete, isprimary=False)
        self._link_co_cog(self.collectionobjects[2], self.test_cog_discrete, isprimary=False)

        co = self.collectionobjects[0]
        response = self.c.post(
            "/inheritance/catalog_number_for_sibling/",
            json.dumps(dict(id=co.id, catalognumber=None)),
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(json.loads(response.content.decode()), 'num-0')

    def test_other_is_primary(self):

        self._link_co_cog(self.collectionobjects[0], self.test_cog_discrete, isprimary=True)
        self._link_co_cog(self.collectionobjects[1], self.test_cog_discrete, isprimary=False)
        self._link_co_cog(self.collectionobjects[2], self.test_cog_discrete, isprimary=False)

        for co in self.collectionobjects[1:3]:
            response = self.c.post(
                "/inheritance/catalog_number_for_sibling/",
                json.dumps(dict(id=co.id)),
                content_type="application/json"
            )

            self._assertStatusCodeEqual(response, 200)
            self.assertEqual(json.loads(response.content.decode()), 'num-0')

    def test_none_is_primary(self):
        # Not sure if this is ever possible, but code handles it.
        self._link_co_cog(self.collectionobjects[0], self.test_cog_discrete, isprimary=False)
        self._link_co_cog(self.collectionobjects[1], self.test_cog_discrete, isprimary=False)
        self._link_co_cog(self.collectionobjects[2], self.test_cog_discrete, isprimary=False)

        for co in self.collectionobjects[1:3]:
            response = self.c.post(
                "/inheritance/catalog_number_for_sibling/",
                json.dumps(dict(id=co.id)),
                content_type="application/json"
            )

            self._assertStatusCodeEqual(response, 200)
            self.assertEqual(json.loads(response.content.decode()), None)
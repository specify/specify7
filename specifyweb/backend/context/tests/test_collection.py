from django.http import HttpResponseBadRequest
from django.test import Client
from specifyweb.specify.serializers import toJson, obj_to_data
from specifyweb.specify.models import Collection
from specifyweb.specify.tests.test_api import ApiTests
import json


class TestCollection(ApiTests):

    def test_collection_get(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/context/collection/")
        self._assertStatusCodeEqual(response, 200)

        self.assertEqual(
            json.loads(response.content.decode()),
            dict(
                available=[json.loads(toJson(obj_to_data(self.collection)))],
                current=None,
            ),
        )

    def test_collection_post(self):
        c = Client()
        c.force_login(self.specifyuser)

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        response = c.post(
            "/context/collection/", collection_2.id, content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        self._assertContentEqual(response, "ok")

    def test_collection_post_bad_value(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            "/context/collection/", "abc", content_type="application/json"
        )

        self._assertStatusCodeEqual(response, HttpResponseBadRequest.status_code)
        self._assertContentEqual(response, "bad collection id")

    def test_collection_post_not_exist(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post("/context/collection/", 0, content_type="application/json")

        self._assertStatusCodeEqual(response, HttpResponseBadRequest.status_code)
        self._assertContentEqual(response, "collection does not exist")

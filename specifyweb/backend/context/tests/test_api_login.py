from django.http import HttpResponseBadRequest, HttpResponseForbidden
from django.test import Client
import json
from specifyweb.specify.tests.test_api import ApiTests


class TestApiLogin(ApiTests):

    def test_login_put_lifecycle(self):
        c = Client()

        response = c.put(
            "/context/login/",
            dict(
                username="testuser", password="testuser", collection=self.collection.id
            ),
            content_type="application/json",
        )

        self._assertStatusCodeEqual(response, 204)

        response = c.get("/context/domain.json")

        self._assertStatusCodeEqual(response, 200)

        response = c.put(
            "/context/login/",
            dict(username="testuser", password="testuser", collection=None),
            content_type="application/json",
        )

        self._assertStatusCodeEqual(response, 204)

        response = c.get("/context/domain.json")

        self._assertStatusCodeEqual(response, 403)

    def test_login_get(self):
        c = Client()

        response = c.get(
            "/context/login/",
        )

        self._assertStatusCodeEqual(response, 200)

        self.assertEqual(
            json.loads(response.content.decode()),
            {
                "collections": {"TestCollection": self.collection.id},
                "username": None,
                "password": None,
                "collection": None,
            },
        )

    def test_login_put_collection_does_not_exist(self):
        c = Client()

        response = c.put(
            "/context/login/",
            dict(username="testuser", password="testuser", collection=0),
            content_type="application/json",
        )

        self._assertStatusCodeEqual(response, HttpResponseBadRequest.status_code)
        self.assertEqual(response.content.decode(), "collection 0 does not exist")

    def test_login_put_wrong_password(self):
        c = Client()

        response = c.put(
            "/context/login/",
            dict(
                username="testuser", password="testuser2", collection=self.collection.id
            ),
            content_type="application/json",
        )

        self._assertStatusCodeEqual(response, HttpResponseForbidden.status_code)

from specifyweb.specify.serializers import obj_to_data, toJson
from specifyweb.specify.tests.test_api import ApiTests
from django.test import Client
import json


class TestUser(ApiTests):

    def test_user(self):
        self.maxDiff = None
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/context/user.json")

        self._assertStatusCodeEqual(response, 200)

        user = json.loads(response.content.decode())
        self.assertTrue(user["isauthenticated"])
        self.assertEqual(
            user["available_collections"],
            [json.loads(toJson(obj_to_data(self.collection)))],
        )
        self.assertEqual(user["agent"], json.loads(toJson(obj_to_data(self.agent))))
        self.assertEqual(user["id"], self.specifyuser.id)

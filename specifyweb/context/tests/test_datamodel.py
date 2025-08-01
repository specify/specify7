import json

from django.test import Client
from specifyweb.specify.models import datamodel
from specifyweb.specify.serialize_datamodel import datamodel_to_json
from specifyweb.specify.tests.test_api import ApiTests


class TestDatamodel(ApiTests):

    def test_fetch(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/context/datamodel.json")
        self.assertEqual((response.content.decode()), datamodel_to_json(datamodel))

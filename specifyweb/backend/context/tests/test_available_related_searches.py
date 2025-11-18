from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests
import json


class TestAvailableRelatedSearches(ApiTests):

    def test_simple_search(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/context/available_related_searches.json")
        self.assertCountEqual(
            json.loads(response.content.decode()),
            [
                "ColObjCollectors",
                "AcceptedTaxon",
                "SynonymCollObjs",
                "CurrCollObject",
                "AgentFromAgentVariant",
                "LocalityAlias",
            ],
        )

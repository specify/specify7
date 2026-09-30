import json
from unittest.mock import patch

from django.test import Client

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)


class TestCollectionobjectCatnumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_cat_number(self, session_context):
        session_context.return_value = TestCollectionobjectCatnumber.test_session_context()

        target = self.collectionobjects[0]
        target.catalognumber = "123"
        target.save()

        c = Client()
        c.force_login(self.specifyuser)

       
        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "operstart": 10,
            "startvalue": "123",
        })

        response = c.post("/stored_query/ephemeral/",query,content_type="application/json",)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[target.id, "123"]]},
        )

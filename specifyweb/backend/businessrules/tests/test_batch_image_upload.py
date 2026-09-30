import json
from unittest.mock import patch

from django.test import Client

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)


class TestCollectionobjectCatalognumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_cat_number(self, session_context):
        session_context.return_value = TestCollectionobjectCatalognumber.test_session_context()

        catnum = self.collectionobjects[0]
        catnum.catalognumber = "123"
        catnum.save()

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
            {"results": [[catnum.id, "123"]]},
        )

class TestCollectionobjectAltCatalogNumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_previous_alt_cat_number(self, session_context):
        session_context.return_value = TestCollectionobjectAltCatalogNumber.test_session_context()

        altcat = self.collectionobjects[0]
        altcat.altcatalognumber = "123"
        altcat.save()

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update({
            "stringid": "1.collectionobject.altCatalogNumber",
            "fieldname": "altCatalogNumber",
            "operstart": 10,
            "startvalue": "123",
        })

        response = c.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[altcat.id, "123"]]},
        )

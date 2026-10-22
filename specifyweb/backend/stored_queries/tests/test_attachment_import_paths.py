import json
from unittest.mock import patch

from django.test import Client

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)


class TestAttachmentImportPaths(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_catalog_number(self, session_context):
        session_context.return_value = (
            TestAttachmentImportPaths.test_session_context()
        )

        collectionobject = self.collectionobjects[0]
        collectionobject.catalognumber = "123"
        collectionobject.save()

        client = Client()
        client.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser)
        query["fields"][0].update(
            {
                "tablelist": "1",
                "stringid": "1.collectionobject.catalogNumber",
                "fieldname": "catalogNumber",
                "operstart": 10,
                "startvalue": "123",
            }
        )

        response = client.post(
            "/stored_query/ephemeral/",
            query,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content.decode())
        self.assertEqual(
            json.loads(response.content.decode()),
            {"results": [[collectionobject.id, "123"]]},
        )

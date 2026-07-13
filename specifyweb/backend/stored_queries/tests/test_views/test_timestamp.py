from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from .raw_query import get_simple_query
from django.test import Client
from unittest.mock import patch, Mock
import json

class TestTimestampQuery(SQLAlchemySetup):

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_timestamp_created_in_results(self, context: Mock):
        context.return_value = TestTimestampQuery.test_session_context()

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser).copy()
        query["fields"] = query["fields"] + [
            {
                "tablelist": "1",
                "stringid": "1.collectionobject.timestampCreated",
                "fieldname": "timestampCreated",
                "isrelfld": False,
                "sorttype": 0,
                "position": 1,
                "isdisplay": True,
                "operstart": 8,
                "startvalue": "",
                "isnot": False,
                "isstrict": False,
                "_tableName": "SpQueryField"
            },
            {
                "tablelist": "1",
                "stringid": "1.collectionobject.timestampModified",
                "fieldname": "timestampModified",
                "isrelfld": False,
                "sorttype": 0,
                "position": 2,
                "isdisplay": True,
                "operstart": 8,
                "startvalue": "",
                "isnot": False,
                "isstrict": False,
                "_tableName": "SpQueryField"
            }
        ]

        response = c.post(f'/stored_query/ephemeral/', query, content_type="application/json")
        self._assertStatusCodeEqual(response, 200)

        results = json.loads(response.content.decode())["results"]

        # Should have 5 results (5 collection objects from setUp)
        self.assertEqual(len(results), 5)

        # Each result should be [id, catalogNumber, timestampCreated, timestampModified]
        for i, row in enumerate(results):
            self.assertEqual(row[0], self.collectionobjects[i].id)
            self.assertEqual(row[1], f"num-{i}")
            # Timestamp Created should not be None or empty
            self.assertIsNotNone(row[2])
            self.assertNotEqual(row[2], "")
            # Timestamp Modified should not be None or empty
            self.assertIsNotNone(row[3])
            self.assertNotEqual(row[3], "")
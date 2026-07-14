from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from .raw_query import get_simple_query
from django.test import Client
from unittest.mock import patch, Mock
import json

class TestSorting(SQLAlchemySetup):

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_sort_ascending(self, context: Mock):
        context.return_value = TestSorting.test_session_context()

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser).copy()
        query["fields"][0]["sorttype"] = 1 # 0 --> no sort, 1 --> ascending, 2 --> descending

        response = c.post('/stored_query/ephemeral/', query, content_type="application/json")
        self._assertStatusCodeEqual(response, 200)

        results = json.loads(response.content.decode())["results"]

        # Should have 5 results (5 collection objects from setUp)
        self.assertEqual(len(results), 5)

        for i, row in enumerate(results):
            self.assertEqual(row[1], f"num-{i}")


    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_sort_descending(self, context: Mock):
        context.return_value = TestSorting.test_session_context()

        c = Client()
        c.force_login(self.specifyuser)

        query = get_simple_query(self.specifyuser).copy()
        query["fields"][0]["sorttype"] = 2 # 0 --> no sort, 1 --> ascending, 2 --> descending

        response = c.post('/stored_query/ephemeral/', query, content_type="application/json")
        self._assertStatusCodeEqual(response, 200)

        results = json.loads(response.content.decode())["results"]

        # Should have 5 results (5 collection objects from setUp)
        self.assertEqual(len(results), 5)

        for i, row in enumerate(results):
            self.assertEqual(row[1], f"num-{4 - i}")




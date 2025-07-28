from specifyweb.specify.api import post_resource
from specifyweb.stored_queries.tests.tests import SQLAlchemySetup
from .raw_query import get_simple_query
from django.test import Client
from unittest.mock import patch, Mock
import json

class TestEphemeral(SQLAlchemySetup):

    @patch("specifyweb.stored_queries.execution.models.session_context")
    def test_run(self, context: Mock):
        context.return_value = TestEphemeral.test_session_context()

        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(f'/stored_query/ephemeral/', get_simple_query(self.specifyuser), content_type="application/json")

        self._assertStatusCodeEqual(response, 200)

        self.assertEqual(
            {'results': [
                [self.collectionobjects[0].id, 'num-0'], 
                [self.collectionobjects[1].id, 'num-1'], 
                [self.collectionobjects[2].id, 'num-2'], 
                [self.collectionobjects[3].id, 'num-3'], 
                [self.collectionobjects[4].id, 'num-4']
                ]
            },
            json.loads(response.content.decode())
        )
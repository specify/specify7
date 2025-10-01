from specifyweb.specify.api.crud import post_resource
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from .raw_query import get_simple_query
from django.test import Client
from unittest.mock import patch, Mock
import json

class TestQuery(SQLAlchemySetup):

    @patch('specifyweb.backend.stored_queries.views.models.session_context')
    def test_query(self, context: Mock):
        context.return_value = TestQuery.test_session_context()

        query = post_resource(
            self.collection, 
            self.agent,
            'spquery',
            get_simple_query(self.specifyuser)
        )
        
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get(f'/stored_query/query/{query.id}/', content_type='application/json')

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
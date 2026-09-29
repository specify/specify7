from unittest.mock import patch
import json

from django.test import Client
from django.db import transaction

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)
from specifyweb.specify import models


class TestCollectionobjectCatnumber(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_match_collectionobject_by_cat_number(self, session_context):
        session_context.return_value = TestCollectionobjectCatnumber.test_session_context()

        with transaction.atomic():
            target = models.Collectionobject.objects.create(
                catalognumber='num-add',
                collection=self.collection,
                collectionmemberid=1,
            )

        target = self.collectionobjects[0]
        target.catalognumber = "123"
        target.save()


        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(f'/stored_query/ephemeral/', get_simple_query(self.specifyuser), content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
                    {'results': [
                            [target.id, '123'],
                            [target.id, 'num-1'],
                            [target.id, 'num-2'],
                            [target.id, 'num-3'],
                            [target.id, 'num-4'],
                            [target.id, 'num-add']
                        ]
                    },
                    json.loads(response.content.decode())
                )




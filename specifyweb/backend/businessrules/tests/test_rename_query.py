from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.api.crud import post_resource, update_obj
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)



class TestRenameQuery(SQLAlchemySetup):


    def setUp(self):
        super().setUp()


    def test_rename_existing_query(self):
        query = post_resource(
            self.collection, 
            self.agent,
            'spquery',
            get_simple_query(self.specifyuser)
        )
                
        update_obj(
            self.collection,
            self.agent,
            'spquery',
            query.id,
            query.version,
            {
                **get_simple_query(self.specifyuser),
                "name": "Renamed Query",
            },
        )

        query.refresh_from_db()
        self.assertEqual(query.name, "Renamed Query")

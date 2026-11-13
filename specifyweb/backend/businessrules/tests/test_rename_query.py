from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.api.crud import post_resource, update_obj
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)



class TestRenameQuery(ApiTests):


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

    def test_create_new_query(self):
        query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            get_simple_query(self.specifyuser),
        )

        self.assertIsNotNone(query.id)
        self.assertEqual(query.name, "New Query")
        self.assertEqual(query.contextname, "CollectionObject")
        self.assertEqual(query.fields.count(), 1)

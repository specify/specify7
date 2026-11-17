from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.api.crud import delete_resource, post_resource, update_obj
from specifyweb.specify import models
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
        query_data = get_simple_query(self.specifyuser)
        query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            query_data,
        )

        self.assertIsNotNone(query.id)
        self.assertEqual(query.name, "New Query")
        self.assertEqual(query.contextname, "CollectionObject")
        self.assertEqual(query.specifyuser_id, self.specifyuser.id)
        self.assertEqual(query.fields.count(), 1)
        self.assertEqual(
            query.fields.get().stringid,
            "1.collectionobject.catalogNumber",
        )

    def test_save_query_as_copy(self):
        query_data = get_simple_query(self.specifyuser)
        first_field = query_data["fields"][0]
        original = post_resource(
            self.collection,
            self.agent,
            'spquery',
            query_data,
        )
        copied_query_data = {
            **query_data,
            "name": "Copied Query",
            "fields": [
                {**first_field, "startvalue": "num-0"},
                {
                    **first_field,
                    "stringid": "1.collectionobject.text1",
                    "fieldname": "text1",
                    "position": 1,
                },
            ],
        }

        copied_query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            copied_query_data,
        )

        self.assertNotEqual(copied_query.id, original.id)
        self.assertEqual(copied_query.name, "Copied Query")
        self.assertEqual(copied_query.fields.count(), 2)
        copied_fields = {
            field.position: field for field in copied_query.fields.all()
        }
        self.assertEqual(copied_fields[0].startvalue, "num-0")
        self.assertEqual(
            copied_fields[1].stringid,
            "1.collectionobject.text1",
        )

        original.refresh_from_db()
        self.assertEqual(original.name, "New Query")
        self.assertEqual(original.fields.count(), 1)
        self.assertEqual(
            original.fields.get().stringid,
            "1.collectionobject.catalogNumber",
        )
        self.assertEqual(original.fields.get().startvalue, "")

    def test_delete_existing_query(self):
        query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            get_simple_query(self.specifyuser),
        )
        other_query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            {**get_simple_query(self.specifyuser), "name": "Other Query"},
        )
        query_id = query.id
        other_query_id = other_query.id

        delete_resource(
            self.collection,
            self.agent,
            'spquery',
            query.id,
            query.version,
        )

        self.assertFalse(models.Spquery.objects.filter(id=query_id).exists())
        self.assertTrue(
            models.Spquery.objects.filter(id=other_query_id).exists()
        )

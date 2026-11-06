from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource, update_obj
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class PicklistTests(ApiTests):
    def test_name_unique_in_collection(self):
        models.Picklist.objects.create(
            collection=self.collection,
            issystem=False,
            name='foobar',
            readonly=False,
            type=0)

        with self.assertRaises(BusinessRuleException):
            models.Picklist.objects.create(
                collection=self.collection,
                issystem=False,
                name='foobar',
                readonly=False,
                type=0)

        models.Picklist.objects.create(
            collection=self.collection,
            issystem=False,
            name='foobaz',
            readonly=False,
            type=0)

    def test_create_user_defined_picklist_with_items(self):
        picklist = post_resource(
            self.collection,
            self.agent,
            'picklist',
            {
                'name': 'UserDefined',
                'type': 0,
                'readonly': False,
                'issystem': False,
                'collection': f'/api/specify/collection/{self.collection.id}/',
                'picklistitems': [
                    {'title': 'First', 'value': 'first', 'ordinal': 0},
                    {'title': 'Second', 'value': 'second', 'ordinal': 1},
                ],
            },
        )

        saved = models.Picklist.objects.get(id=picklist.id)
        self.assertEqual(saved.name, 'UserDefined')
        self.assertEqual(
            list(saved.picklistitems.values_list('title', 'value')),
            [('First', 'first'), ('Second', 'second')],
        )

    def test_update_existing_picklist_item(self):
        picklist = models.Picklist.objects.create(
            collection=self.collection,
            issystem=False,
            name='Existing',
            readonly=False,
            type=0,
        )
        item = picklist.picklistitems.create(
            title='Old title',
            value='old',
            ordinal=0,
        )

        update_obj(
            self.collection,
            self.agent,
            'picklistitem',
            item.id,
            item.version,
            {'title': 'New title', 'value': 'new'},
        )

        item.refresh_from_db()
        self.assertEqual(item.title, 'New title')
        self.assertEqual(item.value, 'new')

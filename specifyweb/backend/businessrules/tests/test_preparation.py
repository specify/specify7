from datetime import datetime

from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class PreparationTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.preptype = models.Preptype.objects.create(
            name='Default Prep Type',
            isloanable=False,
            collection=self.collection,
        )

        self.storagetreedef = models.Storagetreedef.objects.create(
            name='Test Storage tree def'
        )
        self.rootstoragetreedefitem = self.storagetreedef.treedefitems.create(
            name='root',
            rankid=0,
        )
        self.rootstorage = self.rootstoragetreedefitem.treeentries.create(
            name='Storage',
            definition=self.storagetreedef,
            rankid=0,
        )

    def _preparation_data(self, **overrides):
        data = {
            'collectionobject': uri_for_model(
                'collectionobject', self.collectionobjects[0].id
            ),
            'preptype': uri_for_model('preptype', self.preptype.id),
        }
        data.update(overrides)
        return data

    def test_add_preparation_with_count(self):
        preparation = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(countamt=5),
        )

        self.assertExists(
            models.Preparation.objects.filter(
                id=preparation.id,
                countamt=5,
                collectionmemberid=self.collection.id,
            )
        )

    def test_add_preparation_with_prepared_date(self):
        prepared_date = datetime(2025, 6, 15, 12, 30)

        preparation = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(
                prepareddate=prepared_date.isoformat(),
                prepareddateprecision=2,
            ),
        )

        preparation.refresh_from_db()
        self.assertEqual(preparation.prepareddate, prepared_date)
        self.assertEqual(preparation.prepareddateprecision, 2)

    def test_add_preparation_with_existing_storage(self):
        preparation = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(
                storage=uri_for_model('storage', self.rootstorage.id)
            ),
        )

        preparation.refresh_from_db()
        self.assertEqual(preparation.storage_id, self.rootstorage.id)

    def test_create_preparation_with_new_storage(self):
        site = self.rootstoragetreedefitem.children.create(
            name='Site',
            rankid=100,
            treedef=self.storagetreedef,
        )

        preparation = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(
                storage={
                    'name': 'New Storage',
                    'parent': uri_for_model('storage', self.rootstorage.id),
                    'definition': uri_for_model(
                        'storagetreedef', self.storagetreedef.id
                    ),
                    'definitionitem': uri_for_model(
                        'storagetreedefitem', site.id
                    ),
                    'rankid': 100,
                }
            ),
        )

        preparation.refresh_from_db()
        storage = preparation.storage
        self.assertIsNotNone(storage)
        self.assertEqual(storage.name, 'New Storage')
        self.assertEqual(storage.parent_id, self.rootstorage.id)
        self.assertEqual(storage.definitionitem_id, site.id)
        self.assertEqual(storage.definition_id, self.storagetreedef.id)
        self.assertEqual(storage.rankid, 100)

    def test_add_multiple_preparations_to_collection_object(self):
        first = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(countamt=1),
        )
        second = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(countamt=2),
        )

        preparation_ids = set(
            self.collectionobjects[0].preparations.values_list(
                'id', flat=True
            )
        )
        self.assertNotEqual(first.id, second.id)
        self.assertEqual(preparation_ids, {first.id, second.id})

    def test_add_preparation_with_prep_type(self):
        other_preptype = models.Preptype.objects.create(
            name='Other Prep Type',
            isloanable=False,
            collection=self.collection,
        )

        preparation = post_resource(
            self.collection,
            self.agent,
            'preparation',
            self._preparation_data(
                preptype=uri_for_model('preptype', self.preptype.id)
            ),
        )

        preparation.refresh_from_db()
        self.assertEqual(preparation.preptype_id, self.preptype.id)
        self.assertNotEqual(preparation.preptype_id, other_preptype.id)

    def test_barcode_unique_to_collection(self):
        prep_type = models.Preptype.objects.create(
            name='testPrepType',
            isloanable=False,
            collection=self.collection,
        )

        models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            barcode='1',
            preptype=prep_type
        )
        with self.assertRaises(BusinessRuleException):
            models.Preparation.objects.create(
                collectionobject=self.collectionobjects[0],
                barcode='1',
                preptype=prep_type
            )
        with self.assertRaises(BusinessRuleException):
            models.Preparation.objects.create(
                collectionobject=self.collectionobjects[1],
                barcode='1',
                preptype=prep_type
            )
        models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            barcode='2',
            preptype=prep_type
        )

        other_collection = models.Collection.objects.create(
            catalognumformatname='test',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline)

        other_co = models.Collectionobject.objects.create(
            catalognumber='num-1',
            collection=other_collection,
        )
        other_preptype = models.Preptype.objects.create(
            name='otherPrepType',
            isloanable=False,
            collection=other_collection,
        )

        models.Preparation.objects.create(
            collectionobject=other_co,
            barcode='1',
            preptype=other_preptype
        )

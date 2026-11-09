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

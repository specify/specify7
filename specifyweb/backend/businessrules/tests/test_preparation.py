from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class PreparationTests(ApiTests):
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

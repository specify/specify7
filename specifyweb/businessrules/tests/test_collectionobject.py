from specifyweb.specify.models import Collection, Collectionobject, Collectionobjecttype
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class CollectionObjectTests(ApiTests):
    def test_catalog_number_unique_in_collection(self):
        with self.assertRaises(BusinessRuleException):
            Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=self.collectionobjects[0].catalognumber)

        Collectionobject.objects.create(
            collection=self.collection,
            catalognumber=self.collectionobjects[0].catalognumber + 'foo')

    def test_default_collectionobjecttype(self):
        default_type = Collectionobjecttype.objects.create(
            name="default type",
            collection=self.collection,
            taxontreedef=self.discipline.taxontreedef
        )
        self.collection.collectionobjecttype = default_type
        self.collection.save()

        test_co = Collectionobject.objects.create(
            collection=self.collection
        )

        self.assertIsNotNone(test_co.collectionobjecttype)
        self.assertEqual(test_co.collectionobjecttype, default_type)

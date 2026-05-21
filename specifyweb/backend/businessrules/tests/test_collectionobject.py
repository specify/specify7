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

    def test_new_collectionobject_without_collection_default_keeps_null_type(self):
        test_co = Collectionobject.objects.create(
            collection=self.collection
        )

        self.assertIsNone(test_co.collectionobjecttype)

    def test_existing_collectionobject_without_type_uses_collection_default_on_save(self):
        default_type = Collectionobjecttype.objects.create(
            name="default type",
            collection=self.collection,
            taxontreedef=self.discipline.taxontreedef
        )
        self.collection.collectionobjecttype = default_type
        self.collection.save()

        test_co = self.collectionobjects[0]
        Collectionobject.objects.filter(pk=test_co.pk).update(
            collectionobjecttype=None
        )

        test_co.refresh_from_db()
        self.assertIsNone(test_co.collectionobjecttype)

        test_co.save()
        test_co.refresh_from_db()

        self.assertEqual(test_co.collectionobjecttype, default_type)

    def test_existing_collectionobject_without_type_creates_collection_default_on_save(self):
        self.discipline.name = "Fallback Discipline"
        self.discipline.save()

        test_co = self.collectionobjects[0]
        Collectionobject.objects.filter(pk=test_co.pk).update(
            collectionobjecttype=None
        )

        test_co.refresh_from_db()
        self.assertIsNone(test_co.collectionobjecttype)
        self.assertIsNone(self.collection.collectionobjecttype)

        test_co.save()
        test_co.refresh_from_db()
        self.collection.refresh_from_db()

        self.assertIsNotNone(self.collection.collectionobjecttype)
        self.assertEqual(
            self.collection.collectionobjecttype,
            test_co.collectionobjecttype
        )
        self.assertEqual(
            test_co.collectionobjecttype.name,
            "Fallback Discipline"
        )
        self.assertEqual(
            test_co.collectionobjecttype.taxontreedef,
            self.discipline.taxontreedef
        )

    def test_saving_determination_populates_existing_collectionobject_type(self):
        self.discipline.name = "Fallback Discipline"
        self.discipline.save()

        test_co = self.collectionobjects[0]
        Collection.objects.filter(pk=self.collection.pk).update(
            collectionobjecttype=None
        )
        Collectionobject.objects.filter(pk=test_co.pk).update(
            collectionobjecttype=None
        )

        test_co.refresh_from_db()
        self.collection.refresh_from_db()
        self.assertIsNone(test_co.collectionobjecttype)
        self.assertIsNone(self.collection.collectionobjecttype)

        test_co.determinations.create(remarks="new determination")
        test_co.refresh_from_db()
        self.collection.refresh_from_db()

        self.assertIsNotNone(test_co.collectionobjecttype)
        self.assertEqual(
            self.collection.collectionobjecttype,
            test_co.collectionobjecttype
        )
        self.assertEqual(
            test_co.collectionobjecttype.name,
            "Fallback Discipline"
        )
        self.assertEqual(
            test_co.collectionobjecttype.taxontreedef,
            self.discipline.taxontreedef
        )

    def test_saving_determination_uses_collection_default_type(self):
        default_type = Collectionobjecttype.objects.create(
            name="default type",
            collection=self.collection,
            taxontreedef=self.discipline.taxontreedef
        )
        self.collection.collectionobjecttype = default_type
        self.collection.save()

        test_co = self.collectionobjects[0]
        Collectionobject.objects.filter(pk=test_co.pk).update(
            collectionobjecttype=None
        )

        test_co.refresh_from_db()
        self.assertIsNone(test_co.collectionobjecttype)

        test_co.determinations.create(remarks="new determination")
        test_co.refresh_from_db()

        self.assertEqual(test_co.collectionobjecttype, default_type)

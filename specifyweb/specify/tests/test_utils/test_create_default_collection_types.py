from specifyweb.specify.migration_utils.default_cots import create_default_collection_types
from specifyweb.specify.tests.test_api import ApiTests
from django.apps import apps
from specifyweb.specify.models import Collection, Collectionobject, Collectionobjecttype

class TestCreateDefaultCollectionTypes(ApiTests):

    def test_no_collection_case(self):
        Collectionobject.objects.all().delete()
        Collectionobjecttype.objects.all().delete()
        Collection.objects.all().delete()
        create_default_collection_types(apps)

    def _clear_cot_from_co(self):
        self.assertFalse(
            Collectionobject.objects.filter(collectionobjecttype_id__isnull=False).exists()
            )
        self._update(
            self.discipline,
            dict(name="testDiscipline")
        )
        Collectionobjecttype.objects.all().delete()

    def test_unique_collection_code(self):
        # Assert that no collectionobject has a cotype.
        Collectionobject.objects.all().update(collectionobjecttype_id=None)
        self._clear_cot_from_co()

        create_default_collection_types(apps)

        self.assertEqual(Collectionobjecttype.objects.all().count(), 1)
        cot = Collectionobjecttype.objects.all().first()
        self.assertEqual(Collectionobject.objects.filter(collectionobjecttype=cot.id).count(), len(self.collectionobjects))

        self.collection.refresh_from_db()
        self.assertEqual(self.collection.collectionobjecttype_id, cot.id)

    def test_not_unique_collection_code(self):
        # Assert that no collectionobject has a cotype.
        Collectionobject.objects.all().update(collectionobjecttype_id=None)
        self._clear_cot_from_co()

        # Create a new collection
        new_co = Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection2',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        self.assertEqual(Collection.objects.all().count(), 2)
        
        for idx, col_id in enumerate(Collection.objects.order_by('id').values_list('id', flat=True)):
            code_val = "test_code" if idx - 1 == 0 else f"test_code{idx - 1}"
            Collection.objects.filter(id=col_id).update(code=code_val)

        create_default_collection_types(apps)

        self.assertEqual(Collectionobjecttype.objects.all().count(), 2)
        cot = Collectionobjecttype.objects.get(collection_id=self.collection.id)
        new_cot = Collectionobjecttype.objects.get(collection_id=new_co.id)

        self.assertEqual(Collectionobject.objects.filter(collectionobjecttype=cot.id).count(), len(self.collectionobjects))

        self.collection.refresh_from_db()
        new_co.refresh_from_db()

        self.assertEqual(self.collection.collectionobjecttype_id, cot.id)
        self.assertEqual(new_co.collectionobjecttype_id, new_cot.id)

        self.assertTrue(Collection.objects.filter(code="test_code").exists())
        self.assertTrue(Collection.objects.filter(code="test_code-1").exists())
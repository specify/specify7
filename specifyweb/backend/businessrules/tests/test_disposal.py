from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class DisposalTests(ApiTests):
    def test_create_disposal_prep_by_choosing_recordset(self):
        self._create_prep_type()
        prep = self._create_prep(self.collectionobjects[0], None)

        record_set = models.Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=models.Collectionobject.specify_model.tableId,
            name='Disposal Recordset',
            type=0,
            specifyuser=self.specifyuser,
        )

        record_set.recordsetitems.create(
            recordid=self.collectionobjects[0].id,
        )

        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-RECORDSET-001',
        )

        disposal_prep = disposal.disposalpreparations.create(
            preparation=prep,
        )

        fetched = models.Disposalpreparation.objects.get(id=disposal_prep.id)

        self.assertEqual(
            fetched.disposal,
            disposal,
        )
        self.assertEqual(
            fetched.preparation,
            prep,
        )

    def test_create_disposal_prep_by_entering_cat_number(self):
        self._create_prep_type()
        self._create_prep(self.collectionobjects[0], None)

        self.collectionobjects[0].catalognumber = 'CAT-1001'
        self.collectionobjects[0].save()

        co = models.Collectionobject.objects.get(catalognumber='CAT-1001')
        prep = models.Preparation.objects.get(collectionobject=co)

        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-CATNUM-001',
        )
        disposal_prep = models.Disposalpreparation.objects.create(
            disposal=disposal,
            preparation=prep,
        )

        fetched = models.Disposalpreparation.objects.get(id=disposal_prep.id)
        self.assertEqual(fetched.preparation.collectionobject.catalognumber, 'CAT-1001')
        self.assertEqual(fetched.disposal.disposalnumber, 'DISPOSAL-CATNUM-001')

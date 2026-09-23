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
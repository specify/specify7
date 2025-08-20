from specifyweb.backend.interactions.cog_preps import is_co_recordset
from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.models import Recordset, Collectionobject, Collectionobjectgroup


class TestIsCoRecordSet(TestCogInteractions):

    def test_co_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        self.assertTrue(is_co_recordset(recordset))

    def test_not_co_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobjectgroup.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        self.assertFalse(is_co_recordset(recordset))

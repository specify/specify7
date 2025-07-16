from specifyweb.interactions.cog_preps import is_cog_recordset
from specifyweb.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.models import Recordset, Collectionobject, Collectionobjectgroup


class TestIsCogRecordSet(TestCogInteractions):

    def test_not_cog_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        self.assertFalse(is_cog_recordset(recordset))

    def test_cog_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobjectgroup.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        self.assertTrue(is_cog_recordset(recordset))

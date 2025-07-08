from specifyweb.interactions.cog_preps import get_cogs_from_co_recordset
from specifyweb.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.models import Recordset, Collectionobject, Collectionobjectgroup


class TestGetCogsCoRecordset(TestCogInteractions):

    def test_cogs_from_non_co_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobjectgroup.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        self.assertIsNone(get_cogs_from_co_recordset(recordset))

    def test_cogs_from_co_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        TestGetCogsCoRecordset._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )
        TestGetCogsCoRecordset._link_co_cog(
            self.collectionobjects[1], self.test_cog_consolidated
        )
        TestGetCogsCoRecordset._link_co_cog(
            self.collectionobjects[2], self.test_cog_discrete
        )
        TestGetCogsCoRecordset._link_co_cog(
            self.collectionobjects[3], self.test_cog_discrete
        )
        for co in self.collectionobjects:
            recordset.recordsetitems.create(recordid=co.id)

        cogs_found = get_cogs_from_co_recordset(recordset)
        # Previously, there used to be conversion into a set.
        # Below was done for more strictness.
        self.assertCountEqual(
            [cog.id for cog in cogs_found],
            [self.test_cog_consolidated.id, self.test_cog_discrete.id],
        )

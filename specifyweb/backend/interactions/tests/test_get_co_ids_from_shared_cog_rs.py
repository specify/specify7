from specifyweb.backend.interactions.cog_preps import get_co_ids_from_shared_cog_rs
from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.backend.datamodel.models import Recordset, Collectionobject, Collectionobjectgroup


class TestGetCoIdsFromSharedCogRs(TestCogInteractions):

    def test_not_cog_recordset(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        self.assertEqual(get_co_ids_from_shared_cog_rs(recordset), set())

    def test_cog_recordset_ids(self):
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobjectgroup.specify_model.tableId,
            name="Test Recordset",
            type=0,
            specifyuser=self.specifyuser,
        )
        recordset.recordsetitems.create(recordid=self.test_cog_consolidated.id)
        recordset.recordsetitems.create(recordid=self.test_cog_discrete.id)

        TestGetCoIdsFromSharedCogRs._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )
        TestGetCoIdsFromSharedCogRs._link_co_cog(
            self.collectionobjects[1], self.test_cog_consolidated
        )
        TestGetCoIdsFromSharedCogRs._link_co_cog(
            self.collectionobjects[2], self.test_cog_consolidated
        )

        TestGetCoIdsFromSharedCogRs._link_co_cog(
            self.collectionobjects[3], self.test_cog_discrete
        )
        TestGetCoIdsFromSharedCogRs._link_co_cog(
            self.collectionobjects[4], self.test_cog_discrete
        )

        collection_object_set = get_co_ids_from_shared_cog_rs(recordset)

        self.assertEqual(
            collection_object_set, {co.id for co in self.collectionobjects}
        )

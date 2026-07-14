from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.models import Recordset, Recordsetitem, Collectionobject


class RecordSetCreationTests(ApiTests):

    def test_create_record_set_with_multiple_records(self):
        """Create a record set and add multiple Collection Objects to it."""
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test RS with multiple COs",
            type=0,
            specifyuser=self.specifyuser,
        )

        co_ids = [co.id for co in self.collectionobjects]

        Recordsetitem.objects.bulk_create([
            Recordsetitem(recordset=recordset, recordid=co_id)
            for co_id in co_ids
        ])

        self.assertEqual(recordset.recordsetitems.count(), len(co_ids))

        rs_item_ids = set(
            recordset.recordsetitems.values_list("recordid", flat=True)
        )
        self.assertEqual(rs_item_ids, set(co_ids))
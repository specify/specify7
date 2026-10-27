from specifyweb.specify.api.crud import get_resource, update_obj
from specifyweb.specify.models import Collectionobject, Recordset, Recordsetitem
from specifyweb.specify.tests.test_api import ApiTests, skip_perms_check



class RecordSetCreationTests(ApiTests):

    def test_create_new_record_set(self):
        """Create a new record set"""
        recordset = Recordset.objects.create(
            dbtableid=Collectionobject.specify_model.tableId,
            name="first_recordset_name",
            type=0,
            collectionmemberid=self.collection.id,
            specifyuser=self.specifyuser,
        )
        saved = Recordset.objects.get(pk=recordset.pk)
        self.assertEqual(saved.name, "first_recordset_name")

    def test_add_new_record_set(self):
        """Add a new recordset"""
        recordset = Recordset.objects.create(
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test RS add existing",
            type=0,
            collectionmemberid=self.collection.id,
            specifyuser=self.specifyuser,
            )
      
        co_ids = [co.id for co in self.collectionobjects]
        
        Recordsetitem.objects.bulk_create([
            Recordsetitem(recordset=recordset, recordid=co_id)
            for co_id in co_ids
        ])
        self.assertEqual( 
            set(recordset.recordsetitems.values_list("recordid", flat=True)),
            set(co_ids)
        )


        
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

    def test_add_existing_record_to_record_set(self):
        """Add an existing Collection Object to a record set."""
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test RS add existing",
            type=0,
            specifyuser=self.specifyuser,
        )

        self.assertEqual(recordset.recordsetitems.count(), 0)

        existing_co = self.collectionobjects[0]
        recordset.recordsetitems.create(recordid=existing_co.id)

        self.assertEqual(recordset.recordsetitems.count(), 1)
        self.assertEqual(
            recordset.recordsetitems.first().recordid, existing_co.id
        )

    def test_create_record_set_from_query_results(self):
        """Simulate creating a record set from query results by adding
        records that match a query (in this case, all COs in the collection)."""
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test RS from query",
            type=0,
            specifyuser=self.specifyuser,
        )

        matching_cos = Collectionobject.objects.filter(
            collection=self.collection
        )

        Recordsetitem.objects.bulk_create([
            Recordsetitem(recordset=recordset, recordid=co.id)
            for co in matching_cos
        ])

        self.assertEqual(
            recordset.recordsetitems.count(),
            matching_cos.count(),
        )


class RecordSetEditingTests(ApiTests):
    def test_edit_existing_record_set(self):
        """Edit an existing record set by renaming it and replacing one item."""
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Original record set",
            type=0,
            specifyuser=self.specifyuser,
        )
        first = self.collectionobjects[0]
        second = self.collectionobjects[1]
        third = self.collectionobjects[2]
        recordset.recordsetitems.create(recordid=first.id)
        recordset.recordsetitems.create(recordid=second.id)

        data = get_resource("recordset", recordset.id, skip_perms_check)
        data["name"] = "Edited record set"
        data["recordsetitems"] = [
            {"recordid": item.recordid}
            for item in recordset.recordsetitems.all()
            if item.recordid != second.id
        ]
        data["recordsetitems"].append({"recordid": third.id})

        update_obj(
            self.collection,
            self.agent,
            "recordset",
            data["id"],
            data["version"],
            data,
        )

        recordset.refresh_from_db()
        self.assertEqual(recordset.name, "Edited record set")
        self.assertEqual(recordset.version, data["version"] + 1)
        self.assertEqual(
            set(recordset.recordsetitems.values_list("recordid", flat=True)),
            {first.id, third.id},
        )

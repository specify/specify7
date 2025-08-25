from specifyweb.backend.datamodel.models import Recordset, Recordsetitem
from specifyweb.specify.tests.test_update_locality.test_update_locality_context import (
    TestUpdateLocalityContext,
)
from specifyweb.backend.locality_update_tool.update_locality import create_localityupdate_recordset


class TestCreateLocalityUpdateRecordset(TestUpdateLocalityContext):

    def test_record_set_creation(self):
        Recordset.objects.all().delete()

        # Create 5 localities
        localities = self._make_locality([1 for _ in range(5)])

        locality_ids = [objects[0].id for (_, objects) in localities]

        rs = create_localityupdate_recordset(
            self.collection, self.specifyuser, locality_ids
        )

        self.assertTrue(
            Recordset.objects.filter(
                collectionmemberid=self.collection.id,
                specifyuser_id=self.specifyuser.id,
            ).exists()
        )

        self.assertEqual(
            Recordsetitem.objects.filter(
                recordset_id=rs.id, recordid__in=locality_ids
            ).count(),
            len(locality_ids),
        )

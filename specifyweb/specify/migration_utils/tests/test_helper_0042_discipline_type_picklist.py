from unittest.mock import patch

from django.apps import apps
from django.db.models import Prefetch

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.models import (
    Picklist,
    Picklistitem,
    Collection,
    Splocalecontainer,
    Splocalecontaineritem,
)

from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0042_discipline_type_picklist,
)


class CreateDisciplineTypePicklistTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0042_discipline_type_picklist.batch_query"
    )
    def test_create_discipline_type_picklist_creates_picklists_and_items(
        self,
        mock_batch_query,
    ):
        self.other_collection = Collection.objects.create(
            catalognumformatname="test2",
            collectionname="OtherCollection",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        all_ids = list(Collection.objects.values_list("id", flat=True))
        mock_batch_query.return_value = [all_ids]

        helper_0042_discipline_type_picklist.create_discipline_type_picklist(
            apps
        )

        picklists = Picklist.objects.filter(
            name=helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME,
            type=0,
        )

        self.assertEqual(
            picklists.count(),
            len(all_ids),
        )

        expected_item_count = (
            len(all_ids)
            * len(helper_0042_discipline_type_picklist.DISCIPLINE_NAMES)
        )

        self.assertEqual(
            Picklistitem.objects.filter(
                picklist__in=picklists
            ).count(),
            expected_item_count,
        )

    def test_create_discipline_type_picklist_is_idempotent(self):
        helper_0042_discipline_type_picklist.create_discipline_type_picklist(
            apps
        )

        first_count = Picklist.objects.filter(
            name=helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME
        ).count()

        helper_0042_discipline_type_picklist.create_discipline_type_picklist(
            apps
        )

        second_count = Picklist.objects.filter(
            name=helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME
        ).count()

        self.assertEqual(first_count, second_count)


class DisciplineTypePicklistRevertTests(ApiTests):

    def test_revert_deletes_picklists(self):
        Picklist.objects.create(
            collection=self.collection,
            name=helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME,
            type=0,
            issystem=True,
            readonly=True,
            sizelimit=-1,
            sorttype=1,
        )

        self.assertTrue(
            Picklist.objects.filter(
                name=helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME
            ).exists()
        )

        helper_0042_discipline_type_picklist.revert_discipline_type_picklist(
            apps
        )

        self.assertFalse(
            Picklist.objects.filter(
                name=helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME
            ).exists()
        )


class DisciplineTypeSplocaleContainerItemTests(ApiTests):

    def test_update_splocalecontaineritem_sets_picklist(self):
        container = Splocalecontainer.objects.create(
            name="discipline",
            schematype=0,
            discipline=self.discipline
        )
        item = Splocalecontaineritem.objects.create(
            container=container,
            name="type"
        )

        helper_0042_discipline_type_picklist.update_discipline_type_splocalecontaineritem(apps)

        item.refresh_from_db()
        self.assertEqual(item.picklistname, helper_0042_discipline_type_picklist.DISCIPLINE_TYPE_PICKLIST_NAME)
        self.assertTrue(item.isrequired)


class DisciplineTypeSplocaleContainerItemRevertTests(ApiTests):

    def test_revert_splocalecontaineritem(self):
        helper_0042_discipline_type_picklist.update_discipline_type_splocalecontaineritem(
            apps
        )

        helper_0042_discipline_type_picklist.revert_discipline_type_splocalecontaineritem(
            apps
        )

        qs = self.collection.__class__.objects.all()
        self.assertTrue(qs.exists())
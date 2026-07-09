from unittest.mock import patch, MagicMock

from django.apps import apps
from django.db.models import Prefetch
from django.test import TestCase

from specifyweb.specify.models import Picklist, Picklistitem, Collection
from specifyweb.specify.migration_utils.migration_helpers import helper_0004_stratigraphy_age
from specifyweb.specify.tests.test_api import ApiTests

class CreateAgetypePicklistTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.other_collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

    def test_create_agetype_picklist_creates_items_for_new_picklist(self):
        helper_0004_stratigraphy_age.create_agetype_picklist(apps)

        picklists = Picklist.objects.filter(
            name=helper_0004_stratigraphy_age.AGETYPE_PICKLIST_NAME
        ).prefetch_related(
            Prefetch(
                "picklistitems",
                queryset=Picklistitem.objects.order_by("value"),
                to_attr="testitems"
            )
        )

        collection_count = Collection.objects.all().count()

        self.assertEqual(
            picklists.count(),
            collection_count
        )

        ordered_age_types = tuple(
            (val, val) for val in
            sorted(helper_0004_stratigraphy_age.DEFAULT_AGE_TYPES)
        )
        for picklist in picklists:
            picklist_item_values = tuple(
                (item.title, item.value)
                for item in picklist.testitems
            )

            self.assertEqual(
                ordered_age_types,
                picklist_item_values
            )

class CreateStratSchemaConfigTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age.update_table_schema_config_with_defaults"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age.update_table_field_schema_config_with_defaults"
    )
    def test_create_strat_table_schema_config_with_defaults(
        self,
        mock_field_update,
        mock_table_update,
    ):
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        discipline_model.objects.all.return_value = [
            MagicMock(id=1),
            MagicMock(id=2),
        ]

        mock_apps.get_model.return_value = discipline_model

        helper_0004_stratigraphy_age.create_strat_table_schema_config_with_defaults(
            mock_apps
        )

        self.assertEqual(
            mock_table_update.call_count,
            len(helper_0004_stratigraphy_age.MIGRATION_0004_TABLES) * 2,
        )

        expected_field_calls = (
            sum(
                len(fields)
                for fields in helper_0004_stratigraphy_age.MIGRATION_0004_FIELDS.values()
            )
            * 2
        )

        self.assertEqual(
            mock_field_update.call_count,
            expected_field_calls,
        )

class RevertStratSchemaConfigTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age.revert_table_schema_config"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age.revert_table_field_schema_config"
    )
    def test_revert_strat_table_schema_config_with_defaults(
        self,
        mock_revert_field,
        mock_revert_table,
    ):
        helper_0004_stratigraphy_age.revert_strat_table_schema_config_with_defaults(
            MagicMock()
        )

        self.assertEqual(
            mock_revert_table.call_count,
            len(helper_0004_stratigraphy_age.MIGRATION_0004_TABLES),
        )

        self.assertEqual(
            mock_revert_field.call_count,
            sum(
                len(fields)
                for fields in helper_0004_stratigraphy_age.MIGRATION_0004_FIELDS.values()
            ),
        )

from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0004_stratigraphy_age

class CreateAgetypePicklistTests(TestCase):

    def test_create_agetype_picklist_creates_items_for_new_picklist(self):
        mock_apps = MagicMock()

        collection_model = MagicMock()
        picklist_model = MagicMock()
        picklistitem_model = MagicMock()

        collection1 = MagicMock(id=1)
        collection2 = MagicMock(id=2)

        def get_model(app_label, model_name):
            return {
                "Collection": collection_model,
                "Picklist": picklist_model,
                "Picklistitem": picklistitem_model,
            }[model_name]

        mock_apps.get_model.side_effect = get_model

        collection_model.objects.all.return_value = [
            collection1,
            collection2,
        ]

        picklist_model.objects.get_or_create.side_effect = [
            (MagicMock(), True),
            (MagicMock(), False),
        ]

        helper_0004_stratigraphy_age.create_agetype_picklist(mock_apps)

        self.assertEqual(
            picklistitem_model.objects.get_or_create.call_count,
            len(helper_0004_stratigraphy_age.DEFAULT_AGE_TYPES),
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
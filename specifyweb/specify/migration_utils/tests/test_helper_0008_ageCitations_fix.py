from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0008_ageCitations_fix

class RelativeAgeFieldTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0008_ageCitations_fix.update_table_field_schema_config_with_defaults"
    )
    def test_update_relative_age_fields(self, mock_update):
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        discipline_model.objects.all.return_value = [
            MagicMock(id=1),
            MagicMock(id=2),
        ]

        mock_apps.get_model.return_value = discipline_model

        helper_0008_ageCitations_fix.update_relative_age_fields(mock_apps)

        expected = (
            sum(
                len(fields)
                for fields in helper_0008_ageCitations_fix.MIGRATION_0008_FIELDS.values()
            )
            * 2
        )

        self.assertEqual(mock_update.call_count, expected)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0008_ageCitations_fix.revert_table_field_schema_config"
    )
    def test_revert_relative_age_fields(self, mock_revert):
        helper_0008_ageCitations_fix.revert_relative_age_fields(MagicMock())

        self.assertEqual(
            mock_revert.call_count,
            sum(
                len(fields)
                for fields in helper_0008_ageCitations_fix.MIGRATION_0008_FIELDS.values()
            ),
        )
from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0012_add_cojo_to_schema_config

class CojoSchemaConfigTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0012_add_cojo_to_schema_config.update_table_field_schema_config_with_defaults"
    )
    def test_add_cojo_to_schema_config(self, mock_update):
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        discipline_model.objects.all.return_value = [
            MagicMock(id=1)
        ]

        mock_apps.get_model.return_value = discipline_model

        helper_0012_add_cojo_to_schema_config.add_cojo_to_schema_config(mock_apps)

        self.assertEqual(
            mock_update.call_count,
            sum(
                len(fields)
                for fields in helper_0012_add_cojo_to_schema_config.MIGRATION_0012_FIELDS.values()
            ),
        )

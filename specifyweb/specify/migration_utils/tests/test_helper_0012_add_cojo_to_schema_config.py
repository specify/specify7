from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.apps import apps

from specifyweb.specify.migration_utils.migration_helpers import helper_0012_add_cojo_to_schema_config
from specifyweb.specify.models import Discipline
from specifyweb.specify.tests.test_api import ApiTests

class CojoSchemaConfigTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0012_add_cojo_to_schema_config.update_table_field_schema_config_with_defaults"
    )
    def test_add_cojo_to_schema_config(self, mock_update):
        helper_0012_add_cojo_to_schema_config.add_cojo_to_schema_config(apps)

        expected = (
            Discipline.objects.count()
            * sum(
                len(fields)
                for fields in helper_0012_add_cojo_to_schema_config.MIGRATION_0012_FIELDS.values()
            )
        )

        self.assertEqual(mock_update.call_count, expected)

from unittest.mock import patch

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0020_add_tectonicunit_to_pc_in_schema_config,
)
from django.apps import apps


class AddTectonicUnitTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0020_add_tectonicunit_to_pc_in_schema_config.update_table_field_schema_config_with_defaults"
    )
    def test_add_tectonicunit_to_pc_in_schema_config(
        self,
        mock_update,
    ):
        helper_0020_add_tectonicunit_to_pc_in_schema_config.add_tectonicunit_to_pc_in_schema_config(
            apps
        )

        expected = (
            self.discipline.__class__.objects.count()
            * len(
                helper_0020_add_tectonicunit_to_pc_in_schema_config.MIGRATION_0020_FIELDS[
                    "PaleoContext"
                ]
            )
        )

        self.assertEqual(mock_update.call_count, expected)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0020_add_tectonicunit_to_pc_in_schema_config.revert_table_field_schema_config"
    )
    def test_remove_tectonicunit_from_pc_schema_config(
        self,
        mock_revert,
    ):
        helper_0020_add_tectonicunit_to_pc_in_schema_config.remove_tectonicunit_from_pc_schema_config(
            apps
        )

        mock_revert.assert_called_once_with(
            "PaleoContext",
            "tectonicUnit",
            apps,
        )
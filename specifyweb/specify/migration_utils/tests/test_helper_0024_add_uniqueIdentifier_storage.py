from unittest.mock import patch

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0024_add_uniqueIdentifier_storage,
)
from django.apps import apps


class StorageUniqueIdentifierTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0024_add_uniqueIdentifier_storage.update_table_field_schema_config_with_defaults"
    )
    def test_update_storage_unique_id_fields(
        self,
        mock_update,
    ):
        helper_0024_add_uniqueIdentifier_storage.update_storage_unique_id_fields(
            apps
        )

        expected = (
            self.discipline.__class__.objects.count()
            * len(
                helper_0024_add_uniqueIdentifier_storage.MIGRATION_0024_FIELDS[
                    "Storage"
                ]
            )
        )

        self.assertEqual(mock_update.call_count, expected)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0024_add_uniqueIdentifier_storage.revert_table_field_schema_config"
    )
    def test_revert_storage_unique_id_fields(
        self,
        mock_revert,
    ):
        helper_0024_add_uniqueIdentifier_storage.revert_storage_unique_id_fields(
            apps
        )

        mock_revert.assert_called_once_with(
            "Storage",
            "uniqueIdentifier",
            apps,
        )
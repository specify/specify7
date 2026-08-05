from unittest.mock import patch

from specifyweb.specify.tests.test_api import ApiTests
from django.apps import apps

from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0035_version_required,
)


class VersionRequiredTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0035_version_required.update_table_field_schema_config_params"
    )
    def test_update_version_required(
        self,
        mock_update,
    ):
        helper_0035_version_required.update_version_required(
            apps
        )

        expected = (
            self.discipline.__class__.objects.count()
            * sum(
                len(fields)
                for fields in helper_0035_version_required.MIGRATION_0035_FIELDS.values()
            )
        )

        self.assertEqual(mock_update.call_count, expected)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0035_version_required.update_table_field_schema_config_params"
    )
    def test_revert_version_required(
        self,
        mock_update,
    ):
        helper_0035_version_required.revert_version_required(
            apps
        )

        self.assertTrue(mock_update.called)

        args = mock_update.call_args[0]
        self.assertEqual(args[3]["isrequired"], True)
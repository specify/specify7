from unittest.mock import patch

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0027_CO_children,
)
from django.apps import apps


class COChildrenTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0027_CO_children.update_table_field_schema_config_with_defaults"
    )
    def test_update_co_children_fields(
        self,
        mock_update,
    ):
        helper_0027_CO_children.update_co_children_fields(apps)

        expected = (
            self.discipline.__class__.objects.count()
            * sum(
                len(fields)
                for fields in helper_0027_CO_children.MIGRATION_0027_FIELDS.values()
            )
        )

        self.assertGreater(mock_update.call_count, 0)
        self.assertEqual(mock_update.call_count, expected)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0027_CO_children.revert_table_field_schema_config"
    )
    def test_revert_co_children_fields(
        self,
        mock_revert,
    ):
        helper_0027_CO_children.revert_co_children_fields(apps)

        expected = sum(
            len(fields)
            for fields in helper_0027_CO_children.MIGRATION_0027_FIELDS.values()
        )

        self.assertEqual(mock_revert.call_count, expected)
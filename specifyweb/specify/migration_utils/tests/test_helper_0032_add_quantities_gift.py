from specifyweb.specify.tests.test_api import ApiTests
from unittest.mock import patch

from django.apps import apps

from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0032_add_quantities_gift,
)

class AddQuantitiesGiftTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0032_add_quantities_gift.update_table_field_schema_config_with_defaults"
    )
    def test_add_quantities_gift(
        self,
        mock_update,
    ):
        helper_0032_add_quantities_gift.add_quantities_gift(
            apps
        )

        expected = (
            self.discipline.__class__.objects.count()
            * sum(
                len(fields)
                for fields in helper_0032_add_quantities_gift.MIGRATION_0032_FIELDS.values()
            )
        )

        self.assertEqual(
            mock_update.call_count,
            expected,
        )
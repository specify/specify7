from unittest.mock import call, patch
from django.apps import apps

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0013_collectionobjectgroup_parentcog,
)

class UpdateCogSchemaConfigTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog.revert_table_field_schema_config"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog.update_table_field_schema_config_with_defaults"
    )
    def test_update_cog_schema_config(
        self,
        mock_update,
        mock_revert,
    ):
        helper_0013_collectionobjectgroup_parentcog.update_cog_schema_config(
            apps
        )

        mock_revert.assert_has_calls(
            [
                call(
                    "CollectionObjectGroup",
                    "parentCojo",
                    apps,
                ),
                call(
                    "CollectionObjectGroup",
                    "parentCog",
                    apps,
                ),
            ]
        )

        expected_update_calls = (
            self.discipline.__class__.objects.count()
            * sum(
                len(fields)
                for fields in helper_0013_collectionobjectgroup_parentcog.MIGRATION_0013_FIELDS.values()
            )
        )

        self.assertEqual(
            mock_update.call_count,
            expected_update_calls,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog.revert_table_field_schema_config"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog.update_table_field_schema_config_with_defaults"
    )
    def test_revert_update_cog_schema_config(
        self,
        mock_update,
        mock_revert,
    ):
        helper_0013_collectionobjectgroup_parentcog.revert_update_cog_schema_config(
            apps
        )

        expected_revert_calls = sum(
            len(fields)
            for fields in helper_0013_collectionobjectgroup_parentcog.MIGRATION_0013_FIELDS.values()
        )

        self.assertEqual(
            mock_revert.call_count,
            expected_revert_calls,
        )

        mock_update.assert_any_call(
            "CollectionObjectGroup",
            self.discipline.id,
            "parentCojo",
            apps,
        )
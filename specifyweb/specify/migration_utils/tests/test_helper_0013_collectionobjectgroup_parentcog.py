from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0013_collectionobjectgroup_parentcog

class UpdateCogSchemaConfigTests(TestCase):

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
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        discipline_model.objects.all.return_value = [
            MagicMock(id=1)
        ]

        mock_apps.get_model.return_value = discipline_model

        helper_0013_collectionobjectgroup_parentcog.update_cog_schema_config(mock_apps)

        mock_revert.assert_any_call(
            "CollectionObjectGroup",
            "parentCojo",
            mock_apps,
        )

        mock_revert.assert_any_call(
            "CollectionObjectGroup",
            "parentCog",
            mock_apps,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog.update_table_field_schema_config_with_defaults"
    )
    def test_revert_update_cog_schema_config(
        self,
        mock_update,
    ):
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        discipline_model.objects.all.return_value = [
            MagicMock(id=1)
        ]

        mock_apps.get_model.return_value = discipline_model

        helper_0013_collectionobjectgroup_parentcog.revert_update_cog_schema_config(mock_apps)

        mock_update.assert_any_call(
            "CollectionObjectGroup",
            1,
            "parentCojo",
            mock_apps,
        )
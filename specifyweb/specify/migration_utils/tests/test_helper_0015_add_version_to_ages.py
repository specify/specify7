from unittest.mock import call, patch

from django.apps import apps
from django.test import TestCase

from specifyweb.specify.models import Discipline
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0015_add_version_to_ages


class AddVersionToAgesTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0015_add_version_to_ages.update_table_field_schema_config_with_defaults"
    )
    def test_update_age_schema_config(self, mock_update):
        helper_0015_add_version_to_ages.update_age_schema_config(apps)

        self.assertEqual(mock_update.call_count, Discipline.objects.count() * 2)
        mock_update.assert_has_calls(
            [
                call("AbsoluteAge", self.discipline.id, "version", apps),
                call("RelativeAge", self.discipline.id, "version", apps),
            ],
            any_order=True,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0015_add_version_to_ages.revert_table_field_schema_config"
    )
    def test_revert_update_age_schema_config(self, mock_revert):
        helper_0015_add_version_to_ages.revert_update_age_schema_config(apps)

        mock_revert.assert_has_calls(
            [
                call("AbsoluteAge", "version", apps),
                call("RelativeAge", "version", apps),
            ],
            any_order=True,
        )
        self.assertEqual(mock_revert.call_count, 2)
